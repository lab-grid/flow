from flask import request
from flask_restplus import Resource, fields, Namespace

from server import db
from authorization import AuthError, requires_auth, requires_scope
from database import row2dict, Compound

from api.utils import success_output


api = Namespace('compounds', description='Operations on compounds.', path='/')


compound_input = api.model('CompoundInput', {
    'compound_id': fields.String(256),
    'batch_id': fields.Integer(),
    'target_id': fields.String(256)
})
compound_output = api.model('CompoundOutput', {
    'id': fields.Integer(),
    'compound_id': fields.String(256),
    'batch_id': fields.Integer(),
    'target_id': fields.String(256)
})
compounds_output = api.model('CompoundsOutput', {
    'compounds': fields.List(fields.Nested(compound_output))
})


@api.route('/compound')
class CompoundsResource(Resource):
    @api.doc(security='token', model=compounds_output)
    @requires_auth
    def get(self):
        if requires_scope('read:compounds'):
            return [ row2dict(record) for record in Compound.query.all() ]
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:compounds"'
        }, 401)

    @api.doc(security='token', model=compounds_output, body=compound_input)
    @requires_auth
    def post(self):
        if requires_scope('write:compounds'):
            compound = Compound(**request.json)
            db.session.add(compound)
            db.session.commit()
            return row2dict(compound)
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:compounds"'
        }, 401)


@api.route('/compound/<int:compound_id>')
class CompoundResource(Resource):
    @api.doc(security='token', model=compound_output)
    @requires_auth
    def get(self, compound_id):
        if requires_scope('read:compounds'):
            return row2dict(Compound.query.get(compound_id))
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:compounds"'
        }, 401)

    @api.doc(security='token', model=success_output, body=compound_input)
    @requires_auth
    def put(self, compound_id):
        if requires_scope('write:compounds'):
            compound = Compound.query.filter_by(id=compound_id).update(request.json)
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:compounds"'
        }, 401)

    @api.doc(security='token', model=success_output)
    @requires_auth
    def delete(self, compound_id):
        if requires_scope('write:compounds'):
            Compound.query.filter_by(id=compound_id).delete()
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:compounds"'
        }, 401)
