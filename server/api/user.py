import sys
import urllib.parse

from flask import abort, request
from flask_restx import Resource, fields, Namespace

from functools import wraps

from server import app, db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, get_policies, get_roles
from database import versioned_row_to_dict, strip_metadata, User, UserVersion

from api.utils import success_output, add_owner, add_updator, paginatify


api = Namespace('users', description='Extra-Simple operations on users.', path='/')


user_input = api.model('UserInput', {})
user_output = api.model('UserOutput', { 'id': fields.Integer() })
users_output = api.model('UsersOutput', {
    'users': fields.List(fields.Nested(user_output)),
    'page': fields.Integer(),
    'pageCount': fields.Integer(),
})


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
page_param = {
    'description': 'Page number if using pagination',
    'in': 'query',
    'type': 'int'
}
per_page_param = {
    'description': 'Maximum number of records returned per page if using pagination',
    'in': 'query',
    'type': 'int'
}


def add_role(d):
    d['role'] = get_roles()
    return d


@api.route('/user')
class UsersResource(Resource):
    @api.doc(security='token', model=users_output, params={'page': page_param, 'per_page': per_page_param})
    @requires_auth
    def get(self):
        return paginatify(
            items_label='users',
            items=[
                user
                for user
                in User.query.filter(User.is_deleted != True).all()
                if check_access(path=f"/user/{user.id}", method="GET")
            ],
            item_to_dict=lambda user: add_role(versioned_row_to_dict(api, user, user.current)),
        )

    @api.doc(security='token', model=user_output, body=user_input)
    @requires_auth
    # @requires_access()
    def post(self):
        user_dict = request.json
        # Drop the roles field if it was provided.
        user_dict.pop('roles', None)
        user = User(id=request.current_user["sub"] if request.current_user["sub"] else 42)
        user_version = UserVersion(data=strip_metadata(user_dict), server_version=app.config['SERVER_VERSION'])
        user_version.user = user
        user.current = user_version
        add_owner(user)
        db.session.add_all([user, user_version])
        db.session.commit()
        add_policy(path=f"/user/{str(user.id)}", method="GET")
        add_policy(path=f"/user/{str(user.id)}", method="PUT")
        return add_role(versioned_row_to_dict(api, user, user_version))


@api.route('/user/<string:user_id>')
@api.doc(params={'user_id': user_id_param})
class UserResource(Resource):
    @api.doc(security='token', model=user_output, params={'version_id': version_id_param})
    @requires_auth
    def get(self, user_id):
        user_id = urllib.parse.unquote(user_id)
        if user_id != request.current_user["sub"] and not check_access(path=f"/user/{user.id}", method="GET"):
            abort(403)
            return
        version_id = int(request.args.get('version_id')) if request.args.get('version_id') else None

        if version_id:
            user_version = UserVersion.query\
                .filter(UserVersion.id == version_id)\
                .filter(User.id == user_id)\
                .first()
            if (not user_version) or user_version.user.is_deleted:
                abort(404)
                return
            return add_role(versioned_row_to_dict(api, user_version.user, user_version))
        
        user = User.query.get(user_id)
        if (not user) or user.is_deleted:
            abort(404)
            return
        return add_role(versioned_row_to_dict(api, user, user.current))

    @api.doc(security='token', model=user_output, body=user_input)
    @requires_auth
    @requires_access()
    def put(self, user_id):
        user_id = urllib.parse.unquote(user_id)

        user_dict = request.json
        # Drop the roles field if it was provided.
        user_dict.pop('roles', None)
        user_dict = request.json
        user = User.query.get(user_id)
        if not user or user.is_deleted:
            abort(404)
            return
        user_version = UserVersion(data=strip_metadata(user_dict), server_version=app.config['SERVER_VERSION'])
        user_version.user = user
        add_updator(user_version)
        user.current = user_version
        db.session.add(user_version)
        db.session.commit()
        return add_role(versioned_row_to_dict(api, user, user.current))
