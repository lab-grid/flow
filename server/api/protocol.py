from flask import request
from flask_restplus import Resource, fields, Namespace

from server import db
from authorization import AuthError, requires_auth, requires_scope
from database import row2dict, Protocol

from api.utils import success_output


api = Namespace('protocols', description='Operations on protocols.', path='/')


# Add user_id to sample_set_share table.

# Protocols are "templates" (just the settings for more layers) for "projects":
# - [Maybe] compounds
# - Concentrations
# - Sample ids
# - "Pinned" layers

# - Tags
protocol_input = api.model('ProtocolInput', {
    'name': fields.String(),
    'notes': fields.String()
})
protocol_output = api.model('ProtocolOutput', {
    'id': fields.Integer(),
    'name': fields.String(),
    'notes': fields.String()
})
protocols_output = api.model('ProtocolsOutput', {
    'protocols': fields.List(fields.Nested(protocol_output))
})


@api.route('/protocol')
class ProtocolsResource(Resource):
    @api.doc(security='token', model=protocols_output)
    @requires_auth
    def get(self):
        if requires_scope('read:protocols'):
            return [ row2dict(record) for record in Protocol.query.all() ]
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:protocols"'
        }, 401)

    @api.doc(security='token', model=protocols_output, body=protocol_input)
    @requires_auth
    def post(self):
        if requires_scope('write:protocols'):
            protocol = Protocol(**request.json)
            db.session.add(protocol)
            db.session.commit()
            return row2dict(protocol)
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:protocols"'
        }, 401)


@api.route('/protocol/<int:protocol_id>')
class ProtocolResource(Resource):
    @api.doc(security='token', model=protocol_output)
    @requires_auth
    def get(self, protocol_id):
        if requires_scope('read:protocols'):
            return row2dict(Protocol.query.get(protocol_id))
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:protocols"'
        }, 401)

    @api.doc(security='token', model=success_output, body=protocol_input)
    @requires_auth
    def put(self, protocol_id):
        if requires_scope('write:protocols'):
            protocol = Protocol.query.filter_by(id=protocol_id).update(request.json)
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:protocols"'
        }, 401)

    @api.doc(security='token', model=success_output)
    @requires_auth
    def delete(self, protocol_id):
        if requires_scope('write:protocols'):
            Protocol.query.filter_by(id=protocol_id).delete()
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:protocols"'
        }, 401)
