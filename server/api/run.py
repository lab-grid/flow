from flask import request
from flask_restx import Resource, fields, Namespace

from functools import wraps

from server import app, db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, delete_policy, get_policies
from database import jsonRow2dict, Run

from api.utils import success_output


api = Namespace('runs', description='Extra-Simple operations on runs.', path='/')


run_input = api.model('RunInput', {})
run_output = api.model('RunOutput', { 'id': fields.Integer() })
runs_output = fields.List(fields.Nested(run_output))


@api.route('/run')
class RunsResource(Resource):
    @api.doc(security='token', model=runs_output)
    @requires_auth
    @requires_scope('read:runs')
    def get(self):
        return [
            jsonRow2dict(record)
            for record
            in Run.query.all()
            if check_access(path=f"/run/{str(record.id)}", method="GET")
        ]

    @api.doc(security='token', model=run_output, body=run_input)
    @requires_auth
    @requires_scope('write:runs')
    # @requires_access()
    def post(self):
        run_dict = request.json
        # Drop the id field if it was provided.
        run_dict.pop('id', None)
        run = Run(data=run_dict)
        db.session.add(run)
        db.session.commit()
        add_policy(path=f"/run/{str(run.id)}", method="GET")
        add_policy(path=f"/run/{str(run.id)}", method="PUT")
        add_policy(path=f"/run/{str(run.id)}", method="DELETE")
        return jsonRow2dict(run)


@api.route('/run/<int:run_id>')
class RunResource(Resource):
    @api.doc(security='token', model=run_output)
    @requires_auth
    @requires_scope('read:runs')
    @requires_access()
    def get(self, run_id):
        query = Run.query.get(run_id)
        return jsonRow2dict(query)

    @api.doc(security='token', model=run_output, body=run_input)
    @requires_auth
    @requires_scope('write:runs')
    @requires_access()
    def put(self, run_id):
        run_dict = request.json
        # Drop the id field if it was provided.
        run_dict.pop('id', None)
        run = Run.query.get(run_id)
        if run:
            run.data = run_dict
        db.session.commit()
        return jsonRow2dict(run)

    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:runs')
    @requires_access()
    def delete(self, run_id):
        run = Run.query.get(run_id)
        if run:
            Run.query\
                .filter(Run.id == run_id)\
                .delete()
        db.session.commit()
        delete_policy(path=f"/run/{str(run.id)}")
        return {
            'success': True
        }


# Permissions -----------------------------------------------------------------


run_permission_output = api.model('RunPermissionOutput', {
    'user': fields.String(),
    'path': fields.String(),
    'method': fields.String()
})
run_permissions_output = fields.List(fields.Nested(run_permission_output))


def requires_permissions_access(method=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if check_access(path=f"/run/{kwargs.get('run_id')}", method=method):
                return f(*args, **kwargs)
            raise AuthError({
                'code': 'forbidden',
                'description': 'User is not allowed to perform this action'
            }, 403)
        return decorated
    return decorator


@api.route('/run/<int:run_id>/permission')
class RunPermissionsResource(Resource):
    @api.doc(security='token', model=run_permissions_output)
    @requires_auth
    @requires_scope('read:runs')
    @requires_permissions_access()
    def get(self, run_id):
        return get_policies(path=f"/run/{run_id}")


@api.route('/run/<int:run_id>/permission/<string:method>/<string:user_id>')
class RunPermissionResource(Resource):
    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:runs')
    @requires_permissions_access('PUT')
    def post(self, run_id, method, user_id):
        add_policy(user=user_id, path=f"/run/{run_id}", method=method)
        return {
            'success': True
        }

    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:runs')
    @requires_permissions_access('PUT')
    def delete(self, run_id, method, user_id):
        delete_policy(user=user_id, path=f"/run/{run_id}", method=method)
        return {
            'success': True
        }
