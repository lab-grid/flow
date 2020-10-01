from flask import request
from flask_restplus import Resource, fields, Namespace

from server import app, db
from authorization import AuthError, requires_auth, requires_scope
from database import row2dict, DemoRun, DemoRunPermission

from api.utils import success_output


api = Namespace('demo-runs', description='Extra-Simple operations on runs.', path='/')


# - Tags
demo_run_input = api.model('RunInput', {
    'data': fields.Raw()
})
demo_run_output = api.model('RunOutput', {
    'id': fields.Integer(),
    'data': fields.Raw()
})
demo_runs_output = api.model('RunsOutput', {
    'runs': fields.List(fields.Nested(demo_run_output))
})


@api.route('/demo-run')
class DemoRunsResource(Resource):
    @api.doc(security='token', model=demo_runs_output)
    @requires_auth
    def get(self):
        if requires_scope('read:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            query = DemoRun.query\
                .join(DemoRunPermission, DemoRun.id == DemoRunPermission.demo_run_id)\
                .filter(DemoRunPermission.user_id == user_id)\
                .all()
            return [ row2dict(record) for record in query ]
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:runs"'
        }, 401)

    @api.doc(security='token', model=demo_run_output, body=demo_run_input)
    @requires_auth
    def post(self):
        if requires_scope('write:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            run = DemoRun(**request.json)
            db.session.add(run)
            run_permission = DemoRunPermission(user_id=user_id, demo_run=run)
            db.session.add(run_permission)
            db.session.commit()
            return row2dict(run)
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:runs"'
        }, 401)


@api.route('/demo-run/<int:run_id>')
class DemoRunResource(Resource):
    @api.doc(security='token', model=demo_run_output)
    @requires_auth
    def get(self, run_id):
        if requires_scope('read:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            query = DemoRun.query\
                .join(DemoRunPermission, DemoRun.id == DemoRunPermission.demo_run_id)\
                .filter(DemoRunPermission.user_id == user_id)\
                .first()
            return row2dict(query)
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:runs"'
        }, 401)

    @api.doc(security='token', model=success_output, body=demo_run_input)
    @requires_auth
    def put(self, run_id):
        if requires_scope('write:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            run = DemoRun.query\
                .join(DemoRunPermission, DemoRun.id == DemoRunPermission.demo_run_id)\
                .filter(DemoRunPermission.user_id == user_id)\
                .filter(DemoRun.id == run_id)\
                .update(request.json)
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:runs"'
        }, 401)

    @api.doc(security='token', model=success_output)
    @requires_auth
    def delete(self, run_id):
        if requires_scope('write:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            DemoRun.query\
                .join(DemoRunPermission, DemoRun.id == DemoRunPermission.demo_run_id)\
                .filter(DemoRunPermission.user_id == user_id)\
                .filter(DemoRun.id == run_id)\
                .delete()
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:runs"'
        }, 401)


# Permissions -----------------------------------------------------------------


demo_run_permissions_output = api.model('DemoRunPermissionsOutput', {
    'user_ids': fields.List(fields.String())
})


def get_permissions(run_id):
    return DemoRunPermission.query\
        .filter(DemoRunPermission.demo_run_id == run_id)\
        .all()


def validate_access(user_id, user_ids):
    if user_id not in user_ids:
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'User not authorized to read run'
        }, 401)


@api.route('/demo-run/<int:run_id>/permission')
class DemoRunPermissionsResource(Resource):
    @api.doc(security='token', model=demo_run_permissions_output)
    @requires_auth
    def get(self, run_id):
        if requires_scope('read:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            user_ids = [permission.user_id for permission in get_permissions(run_id)]
            validate_access(user_id, user_ids)
            return {
                'user_ids': user_ids
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:runs"'
        }, 401)


@api.route('/demo-run/<int:run_id>/permission/<string:user_id>')
class DemoRunPermissionResource(Resource):
    @api.doc(security='token', model=success_output)
    @requires_auth
    def post(self, run_id, user_id):
        if requires_scope('write:runs'):
            current_user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            user_ids = [permission.user_id for permission in get_permissions(run_id)]
            validate_access(current_user_id, user_ids)
            permission = DemoRunPermission(user_id=user_id, demo_run_id=run_id)
            db.session.add(permission)
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:runs"'
        }, 401)

    @api.doc(security='token', model=success_output)
    @requires_auth
    def delete(self, run_id, user_id):
        if requires_scope('write:runs'):
            current_user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user.sub
            user_ids = [permission.user_id for permission in get_permissions(run_id)]
            validate_access(current_user_id, user_ids)
            DemoRunPermission.query\
                .filter(DemoRunPermission.user_id == user_id)\
                .filter(DemoRunPermission.run_id == run_id)\
                .delete()
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:runs"'
        }, 401)
