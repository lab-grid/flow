from flask import request
from flask_restx import Resource, fields, Namespace

from functools import wraps

from server import app, db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, delete_policy, get_policies
from database import jsonRow2dict, Protocol, ProtocolPermission

from api.utils import success_output


api = Namespace('protocols', description='Extra-Simple operations on protocols.', path='/')


protocol_input = api.model('ProtocolInput', {})
protocol_output = api.model('ProtocolOutput', { 'id': fields.Integer() })
protocols_output = fields.List(fields.Nested(protocol_output))


@api.route('/protocol')
class ProtocolsResource(Resource):
    @api.doc(security='token', model=protocols_output)
    @requires_auth
    @requires_scope('read:protocols')
    def get(self):
        return [
            jsonRow2dict(record)
            for record
            in Protocol.query.all()
            if check_access(path=f"/protocol/{str(record.id)}", method="GET")
        ]

    @api.doc(security='token', model=protocol_output, body=protocol_input)
    @requires_auth
    @requires_scope('write:protocols')
    # @requires_access()
    def post(self):
        protocol_dict = request.json
        # Drop the id field if it was provided.
        protocol_dict.pop('id', None)
        protocol = Protocol(data=protocol_dict)
        db.session.add(protocol)
        db.session.commit()
        add_policy(path=f"/protocol/{str(protocol.id)}", method="GET")
        add_policy(path=f"/protocol/{str(protocol.id)}", method="PUT")
        add_policy(path=f"/protocol/{str(protocol.id)}", method="DELETE")
        return jsonRow2dict(protocol)


@api.route('/protocol/<int:protocol_id>')
class ProtocolResource(Resource):
    @api.doc(security='token', model=protocol_output)
    @requires_auth
    @requires_scope('read:protocols')
    @requires_access()
    def get(self, protocol_id):
        query = Protocol.query.get(protocol_id)
        return jsonRow2dict(query)

    @api.doc(security='token', model=protocol_output, body=protocol_input)
    @requires_auth
    @requires_scope('write:protocols')
    @requires_access()
    def put(self, protocol_id):
        user_id = request.current_user["sub"]
        protocol_dict = request.json
        # Drop the id field if it was provided.
        protocol_dict.pop('id', None)
        protocol = Protocol.query.get(protocol_id)
        if protocol:
            protocol.data = protocol_dict
        db.session.commit()
        return jsonRow2dict(protocol)

    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:protocols')
    @requires_access()
    def delete(self, protocol_id):
        user_id = request.current_user["sub"]
        protocol = Protocol.query.get(protocol_id)
        if protocol:
            Protocol.query\
                .filter(Protocol.id == protocol_id)\
                .delete()
        db.session.commit()
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
class ProtocolPermissionsResource(Resource):
    @api.doc(security='token', model=protocol_permissions_output)
    @requires_auth
    @requires_scope('read:protocols')
    @requires_permissions_access()
    def get(self, protocol_id):
        return get_policies(path=f"/protocol/{protocol_id}")


@api.route('/protocol/<int:protocol_id>/permission/<string:method>/<string:user_id>')
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
