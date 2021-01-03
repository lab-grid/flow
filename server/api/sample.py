from flask import abort, request
from flask_restx import Resource, fields, Namespace

from functools import wraps

from server import app, db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, delete_policy, get_policies
from database import versioned_row_to_dict, json_row_to_dict, strip_metadata, Sample, SampleVersion

from api.utils import filter_by_plate_label, filter_by_reagent_label, filter_by_sample_label, change_allowed, success_output, add_owner, add_updator, protocol_id_param, run_id_param, version_id_param, purge_param, user_id_param, method_param, sample_id_param, protocol_param, plate_param, sample_param, reagent_param, creator_param, archived_param, page_param, per_page_param


api = Namespace('samples', description='Extra-Simple operations on samples.', path='/')


sample_input = api.model('SampleInput', {})
sample_output = api.model('SampleOutput', { 'id': fields.Integer() })
samples_output = api.model('SamplesOutput', {
    'samples': fields.List(fields.Nested(sample_output)),
    'page': fields.Integer(),
    'pageCount': fields.Integer(),
})


def all_samples(include_archived=False):
    query = Sample.query
    if not include_archived:
        query = query.filter(Sample.is_deleted != True)
    return query


@api.route('/sample')
class SamplesResource(Resource):
    @api.doc(security='token', model=samples_output, params={
        'protocol': protocol_param,
        'run': run_param,
        'plate': plate_param,
        'sample': sample_param,
        'reagent': reagent_param,
        'creator': creator_param,
        'archived': archived_param,
        'page': page_param,
        'per_page': per_page_param,
    })
    @requires_auth
    @requires_scope('read:samples')
    def get(self):
        protocol = int(request.args.get('protocol')) if request.args.get('protocol') else None
        run = int(request.args.get('run')) if request.args.get('run') else None
        plate = request.args.get('plate')
        reagent = request.args.get('reagent')
        sample = request.args.get('sample')
        creator = request.args.get('creator')
        archived = request.args.get('archived') == 'true' if request.args.get('archived') else False

        samples_queries = []

        # Add filter specific queries. These will be intersected later on.
        if protocol:
            samples_queries.append(
                all_samples(archived)\
                    .join(ProtocolVersion, ProtocolVersion.id == Sample.protocol_version_id)\
                    .filter(ProtocolVersion.protocol_id == protocol)
            )
        if run:
            samples_queries.append(
                all_samples(archived)\
                    .join(RunVersion, RunVersion.id == Sample.run_version_id)\
                    .filter(RunVersion.run_id == run)
            )
        if plate:
            samples_queries.append(
                all_samples(archived)\
                    .filter(Sample.plate_id == plate)
            )
        if reagent:
            run_version_query = all_samples(archived)\
                .join(RunVersion, RunVersion.id == Sample.run_version_id)
            samples_subquery = filter_by_reagent_label(run_version_query, reagent)
            samples_queries.append(samples_subquery)
        if sample:
            samples_queries.append(
                all_samples(archived)\
                    .filter(Sample.sample_id == sample)
            )
        if creator:
            samples_queries.append(
                all_samples(archived)\
                    .filter(Sample.created_by == creator)
            )

        # Add a basic non-deleted items query if no filters were specified.
        if len(samples_queries) == 0:
            samples_queries.append(all_samples(archived))

        # Only return the intersection of all queries.
        samples_query = reduce(lambda a, b: a.intersect(b), samples_queries)

        results = {}
        if request.args.get('page') is not None or request.args.get('per_page') is not None:
            page = int(request.args.get('page')) if request.args.get('page') else 1
            per_page = int(request.args.get('per_page')) if request.args.get('per_page') else 20
            page_query = samples_query.distinct().paginate(page=page, per_page=per_page)
            results['page'] = page_query.page
            results['pageCount'] = page_query.pages
            query = page_query.items
        else:
            query = samples_query.distinct()

        results['samples'] = [
            versioned_row_to_dict(api, sample, sample.current)
            for sample
            in query
            if check_access(path=f"/run/{str(sample.run_version.run_id)}", method="GET")
        ]
        return results


@api.route('/sample/<int:sample_id>')
@api.doc(params={'sample_id': sample_id_param})
class SampleResource(Resource):
    @api.doc(security='token', model=sample_output, params={'version_id': version_id_param})
    @requires_auth
    @requires_scope('read:samples')
    @requires_access()
    def get(self, sample_id):
        version_id = int(request.args.get('version_id')) if request.args.get('version_id') else None
        
        if version_id:
            sample_version = SampleVersion.query\
                .filter(SampleVersion.id == version_id)\
                .filter(Sample.id == sample_id)\
                .first()
            if (not sample_version) or sample_version.sample.is_deleted:
                abort(404)
                return
            return versioned_row_to_dict(api, sample_version.sample, sample_version)
        
        sample = Sample.query.get(sample_id)
        if (not sample) or sample.is_deleted:
            abort(404)
            return
        return versioned_row_to_dict(api, sample, sample.current)

    @api.doc(security='token', model=sample_output, body=sample_input)
    @requires_auth
    @requires_scope('write:samples')
    @requires_access()
    def put(self, sample_id):
        sample_dict = request.json
        sample = Sample.query.get(sample_id)
        if not sample or sample.is_deleted:
            abort(404)
            return
        if not change_allowed(versioned_row_to_dict(api, sample, sample.current), sample_dict):
            abort(403)
            return
        sample_version = SampleVersion(data=strip_metadata(sample_dict), server_version=app.config['SERVER_VERSION'])
        sample_version.sample = sample
        add_updator(sample_version)
        sample.current = sample_version
        db.session.add(sample_version)
        db.session.commit()
        return versioned_row_to_dict(api, sample, sample.current)
