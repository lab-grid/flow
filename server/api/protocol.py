from flask import abort, request
from flask_restx import Resource, fields, Namespace

from functools import wraps

from server import db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, delete_policy, get_policies
from database import versioned_row_to_dict, json_row_to_dict, strip_metadata, Protocol, ProtocolVersion

from api.utils import success_output


api = Namespace('protocols', description='Extra-Simple operations on protocols.', path='/')


protocol_input = api.model('ProtocolInput', {})
protocol_output = api.model('ProtocolOutput', { 'id': fields.Integer() })
protocols_output = fields.List(fields.Nested(protocol_output))


protocol_id_param = {
    'description': 'Numeric ID for a protocol',
    'in': 'path',
    'type': 'int'
}
version_id_param = {
    'description': 'Specify this query parameter to retrieve a specific protocol version',
    'in': 'query',
    'type': 'int'
}
user_id_param = {
    'description': 'String identifier for a user account',
    'in': 'path',
    'type': 'string'
}
method_param = {
    'description': 'Action identifier (GET|POST|PUT|DELETE)',
    'in': 'path',
    'type': 'string'
}


@api.route('/protocol')
class ProtocolsResource(Resource):
    @api.doc(security='token', model=protocols_output)
    @requires_auth
    @requires_scope('read:protocols')
    def get(self):
        return [
            versioned_row_to_dict(protocol, protocol.current)
            for protocol
            in Protocol.query.filter(Protocol.is_deleted != True).all()
            if check_access(path=f"/protocol/{str(protocol.id)}", method="GET")
        ]

    @api.doc(security='token', model=protocol_output, body=protocol_input)
    @requires_auth
    @requires_scope('write:protocols')
    # @requires_access()
    def post(self):
        protocol_dict = request.json
        protocol = Protocol()
        protocol_version = ProtocolVersion(data=strip_metadata(protocol_dict))
        protocol_version.protocol = protocol
        protocol.current = protocol_version
        db.session.add_all([protocol, protocol_version])
        db.session.commit()
        add_policy(path=f"/protocol/{str(protocol.id)}", method="GET")
        add_policy(path=f"/protocol/{str(protocol.id)}", method="PUT")
        add_policy(path=f"/protocol/{str(protocol.id)}", method="DELETE")
        return versioned_row_to_dict(protocol, protocol_version)


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
            return versioned_row_to_dict(protocol_version.protocol, protocol_version)
        
        protocol = Protocol.query.get(protocol_id)
        if (not protocol) or protocol.is_deleted:
            abort(404)
            return
        return versioned_row_to_dict(protocol, protocol.current)

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
        if not change_allowed(versioned_row_to_dict(protocol, protocol.current), protocol_dict):
            abort(403)
            return
        protocol_version = ProtocolVersion(data=strip_metadata(protocol_dict))
        protocol_version.protocol = protocol
        protocol.current = protocol_version
        db.session.add(protocol_version)
        db.session.commit()
        return versioned_row_to_dict(protocol, protocol.current)

    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:protocols')
    @requires_access()
    def delete(self, protocol_id):
        protocol = Protocol.query.get(protocol_id)
        if not protocol or protocol.is_deleted:
            abort(404)
            return
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
