from flask import abort, request
from flask_restx import Resource, fields, Namespace

from functools import wraps

from server import app, db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, get_policies, get_roles
from database import versioned_row_to_dict, strip_metadata, User, UserVersion

from api.utils import success_output


api = Namespace('users', description='Extra-Simple operations on users.', path='/')


user_input = api.model('UserInput', {})
user_output = api.model('UserOutput', { 'id': fields.Integer() })
users_output = fields.List(fields.Nested(user_output))


user_id_param = {
    'description': 'String identifier for a user account',
    'in': 'path',
    'type': 'string'
}
version_id_param = {
    'description': 'Specify this query parameter to retrieve a specific user version',
    'in': 'query',
    'type': 'int'
}


def add_role(d):
    d['role'] = get_roles()


@api.route('/user')
class UsersResource(Resource):
    @api.doc(security='token', model=users_output)
    @requires_auth
    # @requires_scope('read:users')
    def get(self):
        return [
            add_role(versioned_row_to_dict(user, user.current))
            for user
            in User.query.filter(User.is_deleted != True).all()
            if check_access(path=f"/user/{user.id}", method="GET")
        ]

    @api.doc(security='token', model=user_output, body=user_input)
    @requires_auth
    # @requires_scope('write:users')
    # @requires_access()
    def post(self):
        user_dict = request.json
        # Drop the roles field if it was provided.
        user_dict.pop('roles', None)
        user = User(id=request.current_user["sub"] if request.current_user["sub"] else 42)
        user_version = UserVersion(data=strip_metadata(user_dict))
        user_version.user = user
        user.current = user_version
        db.session.add_all([user, user_version])
        db.session.commit()
        add_policy(path=f"/user/{str(user.id)}", method="GET")
        add_policy(path=f"/user/{str(user.id)}", method="PUT")
        return add_role(versioned_row_to_dict(user, user_version))


@api.route('/user/<string:user_id>')
@api.doc(params={'user_id': user_id_param})
class UserResource(Resource):
    @api.doc(security='token', model=user_output, params={'version_id': version_id_param})
    @requires_auth
    # @requires_scope('read:users')
    @requires_access()
    def get(self, user_id):
        version_id = int(request.args.get('version_id')) if request.args.get('version_id') else None

        if version_id:
            user_version = UserVersion.query\
                .filter(UserVersion.id == version_id)\
                .filter(User.id == user_id)\
                .first()
            if (not user_version) or user_version.user.is_deleted:
                abort(404)
                return
            return add_role(versioned_row_to_dict(user_version.user, user_version))
        
        user = User.query.get(user_id)
        if (not user) or user.is_deleted:
            abort(404)
            return
        return add_role(versioned_row_to_dict(user, user.current))

    @api.doc(security='token', model=user_output, body=user_input)
    @requires_auth
    # @requires_scope('write:users')
    @requires_access()
    def put(self, user_id):
        user_dict = request.json
        # Drop the roles field if it was provided.
        user_dict.pop('roles', None)
        user_dict = request.json
        user = User.query.get(user_id)
        if not user or user.is_deleted:
            abort(404)
            return
        user_version = UserVersion(data=strip_metadata(user_dict))
        user_version.user = user
        user.current = user_version
        db.session.add(user_version)
        db.session.commit()
        return add_role(versioned_row_to_dict(user, user.current))
