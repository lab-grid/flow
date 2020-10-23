from flask import request
from flask_restx import Resource, fields, Namespace

from server import app, db
from authorization import AuthError, requires_auth, requires_scope
from database import jsonRow2dict, Run, RunPermission

from api.utils import success_output


import json
import sys


api = Namespace('runs', description='Extra-Simple operations on runs.', path='/')


run_input = api.model('RunInput', {})
run_output = api.model('RunOutput', { 'id': fields.Integer() })
runs_output = fields.List(fields.Nested(run_output))


@api.route('/run')
class RunsResource(Resource):
    @api.doc(security='token', model=runs_output)
    @requires_auth
    def get(self):
        if requires_scope('read:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user["sub"]
            query = Run.query\
                .join(RunPermission, Run.id == RunPermission.run_id)\
                .filter(RunPermission.user_id == user_id)\
                .all()
            return [ jsonRow2dict(record) for record in query ]
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:runs"'
        }, 401)

    @api.doc(security='token', model=run_output, body=run_input)
    @requires_auth
    def post(self):
        if requires_scope('write:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user["sub"]
            run_dict = request.json
            # Drop the id field if it was provided.
            run_dict.pop('id', None)
            run = Run(data=run_dict)
            db.session.add(run)
            run_permission = RunPermission(user_id=user_id, run=run)
            db.session.add(run_permission)
            db.session.commit()
            return jsonRow2dict(run)
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:runs"'
        }, 401)


@api.route('/run/<int:run_id>')
class RunResource(Resource):
    @api.doc(security='token', model=run_output)
    @requires_auth
    def get(self, run_id):
        if requires_scope('read:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user["sub"]
            query = Run.query\
                .join(RunPermission, Run.id == RunPermission.run_id)\
                .filter(RunPermission.user_id == user_id)\
                .filter(Run.id == run_id)\
                .first()
            return jsonRow2dict(query)
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:runs"'
        }, 401)

    @api.doc(security='token', model=success_output, body=run_input)
    @requires_auth
    def put(self, run_id):
        if requires_scope('write:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user["sub"]
            run_dict = request.json
            # Drop the id field if it was provided.
            run_dict.pop('id', None)
            # TODO: Make this an update, not an overwrite.
            # SEE: https://stackoverflow.com/questions/26703476/how-to-perform-update-operations-on-columns-of-type-jsonb-in-postgres-9-4
            # SEE: https://wiki.postgresql.org/wiki/What%27s_new_in_PostgreSQL_9.5#JSONB-modifying_operators_and_functions
            # SEE: https://dba.stackexchange.com/questions/166092/postgresql-9-4-deep-merge-jsonb-values#comment320704_166092
            run = Run.query\
                .join(RunPermission, Run.id == RunPermission.run_id)\
                .filter(RunPermission.user_id == user_id)\
                .filter(Run.id == run_id)\
                .update({'data': run_dict})
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
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user["sub"]
            run = Run.query\
                .join(RunPermission, Run.id == RunPermission.run_id)\
                .filter(RunPermission.user_id == user_id)\
                .filter(Run.id == run_id)\
                .first()
            if run:
                RunPermission.query\
                    .filter(RunPermission.run_id == run_id)\
                    .delete()
                Run.query\
                    .filter(Run.id == run_id)\
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


run_permissions_output = api.model('RunPermissionsOutput', {
    'user_ids': fields.List(fields.String())
})


def get_permissions(run_id):
    return RunPermission.query\
        .filter(RunPermission.run_id == run_id)\
        .all()


def validate_access(user_id, user_ids):
    if user_id not in user_ids:
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'User not authorized to read run'
        }, 401)


@api.route('/run/<int:run_id>/permission')
class RunPermissionsResource(Resource):
    @api.doc(security='token', model=run_permissions_output)
    @requires_auth
    def get(self, run_id):
        if requires_scope('read:runs'):
            user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user["sub"]
            user_ids = [permission.user_id for permission in get_permissions(run_id)]
            validate_access(user_id, user_ids)
            return {
                'user_ids': user_ids
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:runs"'
        }, 401)


@api.route('/run/<int:run_id>/permission/<string:user_id>')
class RunPermissionResource(Resource):
    @api.doc(security='token', model=success_output)
    @requires_auth
    def post(self, run_id, user_id):
        if requires_scope('write:runs'):
            current_user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user["sub"]
            user_ids = [permission.user_id for permission in get_permissions(run_id)]
            validate_access(current_user_id, user_ids)
            permission = RunPermission(user_id=user_id, run_id=run_id)
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
            current_user_id = '42' if app.config['AUTH_PROVIDER'] == 'none' else request.current_user["sub"]
            user_ids = [permission.user_id for permission in get_permissions(run_id)]
            validate_access(current_user_id, user_ids)
            RunPermission.query\
                .filter(RunPermission.user_id == user_id)\
                .filter(RunPermission.run_id == run_id)\
                .delete()
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:runs"'
        }, 401)
