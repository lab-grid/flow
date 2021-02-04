from flask import abort, request
from flask_restx import Resource, fields, Namespace

from functools import reduce, wraps

from server import app, db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, delete_policy, get_policies
from database import filter_by_plate_label, filter_by_reagent_label, filter_by_sample_label, versioned_row_to_dict, json_row_to_dict, strip_metadata, Protocol, ProtocolVersion, Run, RunVersion

from api.utils import change_allowed, success_output, add_owner, add_updator, protocol_id_param, version_id_param, purge_param, user_id_param, run_param, plate_param, sample_param, reagent_param, creator_param, archived_param, method_param, page_param, per_page_param, paginatify


api = Namespace('protocols', description='Extra-Simple operations on protocols.', path='/')


protocol_input = api.model('ProtocolInput', {})
protocol_output = api.model('ProtocolOutput', { 'id': fields.Integer() })
protocols_output = api.model('ProtocolsOutput', {
    'protocols': fields.List(fields.Nested(protocol_output)),
    'page': fields.Integer(),
    'pageCount': fields.Integer(),
})


def all_protocols(include_archived=False):
    query = Protocol.query
    if not include_archived:
        query = query.filter(Protocol.is_deleted != True)
    return query


@api.route('/protocol')
class ProtocolsResource(Resource):
    @api.doc(security='token', model=protocols_output, params={
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
    @requires_scope('read:protocols')
    def get(self):
        run = int(request.args.get('run')) if request.args.get('run') else None
        plate = request.args.get('plate')
        reagent = request.args.get('reagent')
        sample = request.args.get('sample')
        creator = request.args.get('creator')
        archived = request.args.get('archived') == 'true' if request.args.get('archived') else False

        protocols_queries = []
        if run:
            protocols_queries.append(
                all_protocols(archived)\
                    .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                    .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                    .filter(Run.id == run)
            )
        if plate:
            run_version_query = all_protocols(archived)\
                .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                .join(RunVersion, RunVersion.id == Run.version_id)
            protocols_subquery = filter_by_plate_label(run_version_query, plate)
            protocols_queries.append(protocols_subquery)
        if reagent:
            run_version_query = all_protocols(archived)\
                .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                .join(RunVersion, RunVersion.id == Run.version_id)
            protocols_subquery = filter_by_reagent_label(run_version_query, reagent)
            protocols_queries.append(protocols_subquery)
        if sample:
            run_version_query = all_protocols(archived)\
                .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                .join(RunVersion, RunVersion.id == Run.version_id)
            protocols_subquery = filter_by_sample_label(run_version_query, sample)
            protocols_queries.append(protocols_subquery)
        if creator:
            protocols_queries.append(
                all_protocols(archived)\
                    # .filter(Protocol.id == protocol)\
                    .filter(Protocol.created_by == creator)
            )

        # Add a basic non-deleted items query if no filters were specified.
        if len(protocols_queries) == 0:
            protocols_queries.append(all_protocols(archived))

        # Only return the intersection of all queries.
        protocols_query = reduce(lambda a, b: a.intersect(b), protocols_queries)

        return paginatify(
            items_label='protocols',
            items=[
                protocol
                for protocol
                in protocols_query.distinct().order_by(Protocol.created_on.desc())
                if check_access(path=f"/protocol/{str(protocol.id)}", method="GET") and protocol and protocol.current
            ],
            item_to_dict=lambda protocol: versioned_row_to_dict(api, protocol, protocol.current, include_large_fields=False),
        )

    @api.doc(security='token', model=protocol_output, body=protocol_input)
    @requires_auth
    @requires_scope('write:protocols')
    # @requires_access()
    def post(self):
        protocol_dict = request.json
        protocol = Protocol()
        protocol_version = ProtocolVersion(data=strip_metadata(protocol_dict), server_version=app.config['SERVER_VERSION'])
        protocol_version.protocol = protocol
        protocol.current = protocol_version
        add_owner(protocol)
        db.session.add_all([protocol, protocol_version])
        db.session.commit()
        add_policy(path=f"/protocol/{str(protocol.id)}", method="GET")
        add_policy(path=f"/protocol/{str(protocol.id)}", method="PUT")
        add_policy(path=f"/protocol/{str(protocol.id)}", method="DELETE")
        return versioned_row_to_dict(api, protocol, protocol_version)


@api.route('/protocol/<int:protocol_id>')
@api.doc(params={'protocol_id': protocol_id_param})
class ProtocolResource(Resource):
    @api.doc(security='token', model=protocol_output, params={'version_id': version_id_param})
    @requires_auth
    @requires_scope('read:protocols')
    @requires_access()
    def get(self, protocol_id):
        version_id = int(request.args.get('version_id')) if request.args.get('version_id') else None
        
        if version_id:
            protocol_version = ProtocolVersion.query\
                .filter(ProtocolVersion.id == version_id)\
                .filter(Protocol.id == protocol_id)\
                .first()
            if (not protocol_version) or protocol_version.protocol.is_deleted:
                abort(404)
                return
            return versioned_row_to_dict(api, protocol_version.protocol, protocol_version)
        
        protocol = Protocol.query.get(protocol_id)
        if (not protocol) or protocol.is_deleted:
            abort(404)
            return
        return versioned_row_to_dict(api, protocol, protocol.current)

    @api.doc(security='token', model=protocol_output, body=protocol_input)
    @requires_auth
    @requires_scope('write:protocols')
    @requires_access()
    def put(self, protocol_id):
        protocol_dict = request.json
        protocol = Protocol.query.get(protocol_id)
        if not protocol or protocol.is_deleted:
            abort(404)
            return
        if not change_allowed(versioned_row_to_dict(api, protocol, protocol.current), protocol_dict):
            abort(403)
            return
        protocol_version = ProtocolVersion(data=strip_metadata(protocol_dict), server_version=app.config['SERVER_VERSION'])
        protocol_version.protocol = protocol
        add_updator(protocol_version)
        protocol.current = protocol_version
        db.session.add(protocol_version)
        db.session.commit()
        return versioned_row_to_dict(api, protocol, protocol.current)

    @api.doc(security='token', model=success_output, params={'purge': purge_param})
    @requires_auth
    @requires_scope('write:protocols')
    @requires_access()
    def delete(self, protocol_id):
        purge = request.args.get('purge') == 'true' if request.args.get('purge') else False

        protocol = Protocol.query.get(protocol_id)
        if not protocol or protocol.is_deleted:
            abort(404)
            return
        if purge:
            db.session.delete(protocol)
        else:
            protocol.is_deleted = True
        db.session.commit()
        delete_policy(path=f"/protocol/{str(protocol.id)}")
        return {
            'success': True
        }


# Permissions -----------------------------------------------------------------


protocol_permission_output = api.model('ProtocolPermissionOutput', {
    'user': fields.String(),
    'path': fields.String(),
    'method': fields.String()
})
protocol_permissions_output = fields.List(fields.Nested(protocol_permission_output))


def requires_permissions_access(method=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if check_access(path=f"/protocol/{kwargs.get('protocol_id')}", method=method):
                return f(*args, **kwargs)
            raise AuthError({
                'code': 'forbidden',
                'description': 'User is not allowed to perform this action'
            }, 403)
        return decorated
    return decorator


@api.route('/protocol/<int:protocol_id>/permission')
@api.doc(params={'protocol_id': protocol_id_param})
class ProtocolPermissionsResource(Resource):
    @api.doc(security='token', model=protocol_permissions_output)
    @requires_auth
    @requires_scope('read:protocols')
    @requires_permissions_access()
    def get(self, protocol_id):
        return get_policies(path=f"/protocol/{protocol_id}")


@api.route('/protocol/<int:protocol_id>/permission/<string:method>/<string:user_id>')
@api.doc(params={'protocol_id': protocol_id_param, 'user_id': user_id_param, 'method': method_param})
class ProtocolPermissionResource(Resource):
    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:protocols')
    @requires_permissions_access('PUT')
    def post(self, protocol_id, method, user_id):
        add_policy(user=user_id, path=f"/protocol/{protocol_id}", method=method)
        return {
            'success': True
        }

    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:protocols')
    @requires_permissions_access('PUT')
    def delete(self, protocol_id, method, user_id):
        delete_policy(user=user_id, path=f"/protocol/{protocol_id}", method=method)
        return {
            'success': True
        }
