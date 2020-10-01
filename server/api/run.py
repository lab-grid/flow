from flask import request
from flask_restplus import Resource, fields, Namespace

from server import db
from authorization import AuthError, requires_auth, requires_scope
from database import row2dict, Run

from api.utils import success_output


api = Namespace('runs', description='Operations on runs.', path='/')


# - Tags
run_input = api.model('RunInput', {
    'protocol_id': fields.Integer(),
    'name': fields.String(),
    'notes': fields.String(),
    'data_link': fields.String()
})
run_output = api.model('RunOutput', {
    'id': fields.Integer(),
    'protocol_id': fields.Integer(),
    'name': fields.String(),
    'notes': fields.String(),
    'data_link': fields.String()
})
runs_output = api.model('RunsOutput', {
    'runs': fields.List(fields.Nested(run_output))
})


@api.route('/run')
class RunsResource(Resource):
    @api.doc(security='token', model=runs_output)
    @requires_auth
    def get(self):
        if requires_scope('read:runs'):
            return [ row2dict(record) for record in Run.query.all() ]
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:runs"'
        }, 401)

    @api.doc(security='token', model=run_output, body=run_input)
    @requires_auth
    def post(self):
        if requires_scope('write:runs'):
            run = Run(**request.json)
            db.session.add(run)
            db.session.commit()
            return row2dict(run)
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
            return row2dict(Run.query.get(run_id))
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:runs"'
        }, 401)

    @api.doc(security='token', model=success_output, body=run_input)
    @requires_auth
    def put(self, run_id):
        if requires_scope('write:runs'):
            run = Run.query.filter_by(id=run_id).update(request.json)
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
            Run.query.filter_by(id=run_id).delete()
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:runs"'
        }, 401)
