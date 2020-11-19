from flask import request
from flask_restx import Resource, fields, Namespace

from authorization import AuthError, requires_auth, requires_scope, check_access
from database import versioned_row_to_dict, Protocol, ProtocolVersion, Run, RunVersion

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


@api.route('/search')
class ProtocolsResource(Resource):
    @api.doc(security='token', model=search_results, params={'protocol': protocol_param, 'run': run_param, 'plate': plate_param})
    @requires_auth
    @requires_scope('read:protocols')
    @requires_scope('read:runs')
    def get(self):
        protocol = int(request.args.get('protocol')) if request.args.get('protocol') else None
        run = int(request.args.get('run')) if request.args.get('run') else None
        plate = request.args.get('plate')

        protocolsQuery = Protocol.query.filter(Protocol.is_deleted != True)
        runsQuery = Run.query.filter(Run.is_deleted != True)

        if protocol:
            protocolsQuery = protocolsQuery\
                .filter(Protocol.id == protocol)
            runsQuery = runsQuery\
                .join(ProtocolVersion, ProtocolVersion.id == Run.protocol_version_id)\
                .filter(ProtocolVersion.protocol_id == protocol)
        if run:
            protocolsQuery = protocolsQuery\
                .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                .filter(Run.id == run)
            runsQuery = runsQuery\
                .filter(Run.id == run)
        if plate:
            # ???
            pass

        protocols = [
            versioned_row_to_dict(api, protocol, protocol.current)
            for protocol
            in protocolsQuery.distinct()
            if check_access(path=f"/protocol/{str(protocol.id)}", method="GET")
        ]
        runs = [
            versioned_row_to_dict(api, run, run.current)
            for run
            in runsQuery.distinct()
            if check_access(path=f"/run/{str(run.id)}", method="GET")
        ]
        return {
            'protocols': protocols,
            'runs': runs
        }
