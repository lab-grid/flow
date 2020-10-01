from flask import request
from flask_restplus import Resource, fields, Namespace

from server import db
from authorization import AuthError, requires_auth, requires_scope
from database import row2dict, Derivation

from api.utils import success_output


api = Namespace('derivations', description='Operations on derivations.', path='/')


derivation_input = api.model('DerivationInput', {
    'name': fields.String(),
    'notes': fields.String(),
    'formula': fields.String()
})
derivation_output = api.model('DerivationOutput', {
    'id': fields.Integer(),
    'name': fields.String(),
    'notes': fields.String(),
    'formula': fields.String()
})
derivations_output = api.model('DerivationsOutput', {
    'derivations': fields.List(fields.Nested(derivation_output))
})


@api.route('/derivation')
class DerivationsResource(Resource):
    @api.doc(security='token', model=derivations_output)
    @requires_auth
    def get(self):
        if requires_scope('read:derivations'):
            return [ row2dict(record) for record in Derivation.query.all() ]
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:derivations"'
        }, 401)

    @api.doc(security='token', model=derivations_output, body=derivation_input)
    @requires_auth
    def post(self):
        if requires_scope('write:derivations'):
            derivation = Derivation(**request.json)
            db.session.add(derivation)
            db.session.commit()
            return row2dict(derivation)
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:derivations"'
        }, 401)


@api.route('/derivation/<int:derivation_id>')
class DerivationResource(Resource):
    @api.doc(security='token', model=derivation_output)
    @requires_auth
    def get(self, derivation_id):
        if requires_scope('read:derivations'):
            return row2dict(Derivation.query.get(derivation_id))
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "read:derivations"'
        }, 401)

    @api.doc(security='token', model=success_output, body=derivation_input)
    @requires_auth
    def put(self, derivation_id):
        if requires_scope('write:derivations'):
            derivation = Derivation.query.filter_by(id=derivation_id).update(request.json)
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:derivations"'
        }, 401)

    @api.doc(security='token', model=success_output)
    @requires_auth
    def delete(self, derivation_id):
        if requires_scope('write:derivations'):
            Derivation.query.filter_by(id=derivation_id).delete()
            db.session.commit()
            return {
                'success': True
            }
        raise AuthError({
            'code': 'Unauthorized',
            'description': 'Token missing scope "write:derivations"'
        }, 401)
