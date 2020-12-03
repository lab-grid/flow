from functools import reduce
from sqlalchemy import or_
from sqlalchemy.sql import func
from sqlalchemy.orm import aliased

from flask import request
from flask_restx import Resource, fields, Namespace

from authorization import AuthError, requires_auth, requires_scope, check_access
from database import versioned_row_to_dict, Protocol, ProtocolVersion, Run, RunVersion, get_samples, run_to_sample

from api.protocol import protocol_output
from api.run import run_output


api = Namespace('search-results', description='Operations for searching for runs and protocols with various filters.', path='/')


search_results = api.model('SearchResults', {
    'protocols': fields.List(fields.Nested(protocol_output)),
    'runs': fields.List(fields.Nested(run_output))
})


protocol_param = {
    'description': 'Numeric ID for a protocol to filter by',
    'in': 'query',
    'type': 'int'
}
run_param = {
    'description': 'Numeric ID for a run to filter by',
    'in': 'query',
    'type': 'int'
}
plate_param = {
    'description': 'Identifier for a plate to filter by',
    'in': 'query',
    'type': 'string'
}
sample_param = {
    'description': 'Identifier for a sample to filter by',
    'in': 'query',
    'type': 'string'
}
reagent_param = {
    'description': 'Identifier for a reagent to filter by',
    'in': 'query',
    'type': 'string'
}


def all_protocols():
    return Protocol.query.filter(Protocol.is_deleted != True)

def all_runs():
    return Run.query.filter(Run.is_deleted != True)

def filter_by_plate_label(run_version_query, plate_id):
    return run_version_query.filter(
        or_(
            func.jsonb_path_exists(RunVersion.data, f'$.sections[*].blocks[*].plateLabels["{plate_id}"]'),
            func.jsonb_path_exists(RunVersion.data, f'$.sections[*].blocks[*].mappings["{plate_id}"]'),
            func.jsonb_path_match(RunVersion.data, f'exists($.sections[*].blocks[*].plateLabel ? (@ == "{plate_id}"))')
        )
    )

def filter_by_reagent_label(run_version_query, reagent_id):
    return run_version_query.filter(
        func.jsonb_path_match(RunVersion.data, f'exists($.sections[*].blocks[*].definition.reagentLabel ? (@ == "{reagent_id}"))')
    )

def filter_by_sample_label(run_version_query, sample_id):
    return run_version_query.filter(
        func.jsonb_path_match(RunVersion.data, f'exists($.sections[*].blocks[*].plateMappings[*].sampleLabel ? (@ == "{sample_id}"))')
    )


@api.route('/search')
class ProtocolsResource(Resource):
    @api.doc(
        security='token',
        model=search_results,
        params={
            'protocol': protocol_param,
            'run': run_param,
            'plate': plate_param,
            'sample': sample_param,
            'reagent': reagent_param,
        }
    )
    @requires_auth
    @requires_scope('read:protocols')
    @requires_scope('read:runs')
    def get(self):
        protocol = int(request.args.get('protocol')) if request.args.get('protocol') else None
        run = int(request.args.get('run')) if request.args.get('run') else None
        plate = request.args.get('plate')
        reagent = request.args.get('reagent')
        sample = request.args.get('sample')

        protocols_queries = []
        runs_queries = []
        samples_queries = []

        # Add filter specific queries. These will be intersected later on.
        if protocol:
            protocols_queries.append(
                all_protocols().filter(Protocol.id == protocol)
            )
            runs_queries.append(
                all_runs()\
                    .join(ProtocolVersion, ProtocolVersion.id == Run.protocol_version_id)\
                    .filter(ProtocolVersion.protocol_id == protocol)
            )
        if run:
            protocols_queries.append(
                all_protocols()\
                    .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                    .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                    .filter(Run.id == run)
            )
            runs_queries.append(
                all_runs().filter(Run.id == run)
            )
        if plate:
            run_version_query = all_runs()\
                .join(RunVersion, RunVersion.id == Run.version_id)
            runs_subquery = filter_by_plate_label(run_version_query, plate)
            runs_queries.append(runs_subquery)

            run_version_query = all_protocols()\
                .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                .join(RunVersion, RunVersion.id == Run.version_id)
            protocols_subquery = filter_by_plate_label(run_version_query, plate)
            protocols_queries.append(protocols_subquery)
        if reagent:
            run_version_query = all_runs()\
                .join(RunVersion, RunVersion.id == Run.version_id)
            runs_subquery = filter_by_reagent_label(run_version_query, reagent)
            runs_queries.append(runs_subquery)

            run_version_query = all_protocols()\
                .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                .join(RunVersion, RunVersion.id == Run.version_id)
            protocols_subquery = filter_by_reagent_label(run_version_query, reagent)
            protocols_queries.append(protocols_subquery)
        if sample:
            run_version_query = all_runs()\
                .join(RunVersion, RunVersion.id == Run.version_id)
            runs_subquery = filter_by_sample_label(run_version_query, sample)
            runs_queries.append(runs_subquery)

            run_version_query = all_protocols()\
                .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                .join(RunVersion, RunVersion.id == Run.version_id)
            protocols_subquery = filter_by_sample_label(run_version_query, sample)
            protocols_queries.append(protocols_subquery)

        # Add a basic non-deleted items query if no filters were specified.
        if len(protocols_queries) == 0:
            protocols_queries.append(Protocol.query.filter(Protocol.is_deleted != True))
        if len(runs_queries) == 0:
            runs_queries.append(Run.query.filter(Run.is_deleted != True))
        if len(samples_queries) == 0:
            samples_queries.append(get_samples(sample_id=sample, plate_id=plate, protocol_id=protocol, run_id=run))

        # Only return the intersection of all queries.
        protocols_query = reduce(lambda a, b: a.intersect(b), protocols_queries)
        runs_query = reduce(lambda a, b: a.intersect(b), runs_queries)
        samples_query = reduce(lambda a, b: a.intersect(b), samples_queries)

        # Convert database models to dictionaries and return the serch results.
        protocols = [
            versioned_row_to_dict(api, protocol, protocol.current)
            for protocol
            in protocols_query.distinct()
            if check_access(path=f"/protocol/{str(protocol.id)}", method="GET")
        ]
        runs = [
            versioned_row_to_dict(api, run, run.current)
            for run
            in runs_query.distinct()
            if check_access(path=f"/run/{str(run.id)}", method="GET")
        ]
        samples = [
            run_to_sample(sample)
            for sample
            in samples_query.distinct()
            # if check_access(path=f"/sample/{str(sample_id)}", method="GET")
        ]
        return {
            'protocols': protocols,
            'runs': runs,
            'samples': samples,
        }
