from flask import request
from flask_restplus import Resource, fields, Namespace

from server import app, db
from authorization import AuthError, requires_auth, requires_scope
from database import row2dict, Protocol, ProtocolPermission

from api.utils import success_output


api = Namespace('protocols', description='Extra-Simple operations on protocols.', path='/')


# - Tags
protocol_input = api.model('ProtocolInput', {
    'data': fields.Raw()
})
protocol_output = api.model('ProtocolOutput', {
    'id': fields.Integer(),
    'data': fields.Raw()
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
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            query = Protocol.query\
                .join(ProtocolPermission, Protocol.id == ProtocolPermission.protocol_id)\
                .filter(ProtocolPermission.user_id == user_id)\
                .all()
            return [ row2dict(record) for record in query ]
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:protocols"'
        }, 401)

    @api.doc(security='token', model=protocol_output, body=protocol_input)
    @requires_auth
    def post(self):
        if requires_scope('write:protocols'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            protocol = Protocol(**request.json)
            db.session.add(protocol)
            protocol_permission = ProtocolPermission(user_id=user_id, protocol=protocol)
            db.session.add(protocol_permission)
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
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            query = Protocol.query\
                .join(ProtocolPermission, Protocol.id == ProtocolPermission.protocol_id)\
                .filter(ProtocolPermission.user_id == user_id)\
                .first()
            return row2dict(query)
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:protocols"'
        }, 401)

    @api.doc(security='token', model=success_output, body=protocol_input)
    @requires_auth
    def put(self, protocol_id):
        if requires_scope('write:protocols'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            protocol = Protocol.query\
                .join(ProtocolPermission, Protocol.id == ProtocolPermission.protocol_id)\
                .filter(ProtocolPermission.user_id == user_id)\
                .filter(Protocol.id == protocol_id)\
                .update(request.json)
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
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            Protocol.query\
                .join(ProtocolPermission, Protocol.id == ProtocolPermission.protocol_id)\
                .filter(ProtocolPermission.user_id == user_id)\
                .filter(Protocol.id == protocol_id)\
                .delete()
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:protocols"'
        }, 401)


# Permissions -----------------------------------------------------------------


protocol_permissions_output = api.model('ProtocolPermissionsOutput', {
    'user_ids': fields.List(fields.String())
})


def get_permissions(protocol_id):
    return ProtocolPermission.query\
        .filter(ProtocolPermission.protocol_id == protocol_id)\
        .all()


def validate_access(user_id, user_ids):
    if user_id not in user_ids:
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'User not authorized to read protocol'
        }, 401)


@api.route('/protocol/<int:protocol_id>/permission')
class ProtocolPermissionsResource(Resource):
    @api.doc(security='token', model=protocol_permissions_output)
    @requires_auth
    def get(self, protocol_id):
        if requires_scope('read:protocols'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            user_ids = [permission.user_id for permission in get_permissions(protocol_id)]
            validate_access(user_id, user_ids)
            return {
                'user_ids': user_ids
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:protocols"'
        }, 401)


@api.route('/protocol/<int:protocol_id>/permission/<string:user_id>')
class ProtocolPermissionResource(Resource):
    @api.doc(security='token', model=success_output)
    @requires_auth
    def post(self, protocol_id, user_id):
        if requires_scope('write:protocols'):
            current_user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            user_ids = [permission.user_id for permission in get_permissions(protocol_id)]
            validate_access(current_user_id, user_ids)
            permission = ProtocolPermission(user_id=user_id, protocol_id=protocol_id)
            db.session.add(permission)
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
    def delete(self, protocol_id, user_id):
        if requires_scope('write:protocols'):
            current_user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            user_ids = [permission.user_id for permission in get_permissions(protocol_id)]
            validate_access(current_user_id, user_ids)
            ProtocolPermission.query\
                .filter(ProtocolPermission.user_id == user_id)\
                .filter(ProtocolPermission.protocol_id == protocol_id)\
                .delete()
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:protocols"'
        }, 401)
