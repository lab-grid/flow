from flask import request
from flask_restx import Resource, fields, Namespace

from functools import wraps

from server import app, db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, get_policies, get_roles
from database import jsonRow2dict, User

from api.utils import success_output


api = Namespace('users', description='Extra-Simple operations on users.', path='/')


user_input = api.model('UserInput', {})
user_output = api.model('UserOutput', { 'id': fields.Integer() })
users_output = fields.List(fields.Nested(user_output))


def add_role(d):
    d['role'] = get_roles()


@api.route('/user')
class UsersResource(Resource):
    @api.doc(security='token', model=users_output)
    @requires_auth
    # @requires_scope('read:users')
    def get(self):
        return [
            add_role(jsonRow2dict(record))
            for record
            in User.query.all()
            if check_access(path=f"/user/{str(record.id)}", method="GET")
        ]

    @api.doc(security='token', model=user_output, body=user_input)
    @requires_auth
    # @requires_scope('write:users')
    # @requires_access()
    def post(self):
        user_dict = request.json
        # Drop the id field if it was provided.
        user_dict.pop('id', None)
        # Drop the roles field if it was provided.
        user_dict.pop('roles', None)
        user = User(id=request.current_user["sub"], data=user_dict)
        db.session.add(user)
        db.session.commit()
        add_policy(path=f"/user/{str(user.id)}", method="GET")
        add_policy(path=f"/user/{str(user.id)}", method="PUT")
        return add_role(jsonRow2dict(user))


@api.route('/user/<int:user_id>')
class UserResource(Resource):
    @api.doc(security='token', model=user_output)
    @requires_auth
    # @requires_scope('read:users')
    @requires_access()
    def get(self, user_id):
        query = User.query.get(user_id)
        return add_role(jsonRow2dict(query))

    @api.doc(security='token', model=user_output, body=user_input)
    @requires_auth
    # @requires_scope('write:users')
    @requires_access()
    def put(self, user_id):
        user_dict = request.json
        # Drop the id field if it was provided.
        user_dict.pop('id', None)
        # Drop the roles field if it was provided.
        user_dict.pop('roles', None)
        user = User.query.get(user_id)
        if user:
            user.data = user_dict
        db.session.commit()
        return add_role(jsonRow2dict(user))
