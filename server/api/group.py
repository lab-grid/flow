from flask_restx import Resource, fields, Namespace

from authorization import requires_auth, requires_scope, get_all_roles


api = Namespace('groups', description='Extra-Simple operations on groups.', path='/')


group_output = api.model('GroupOutput', { 'id': fields.String() })
groups_output = fields.List(fields.Nested(group_output))


@api.route('/group')
class GroupsResource(Resource):
    @api.doc(security='token', model=groups_output)
    @requires_auth
    # @requires_scope('read:groups')
    def get(self):
        return [
            {'id': role}
            for role
            in get_all_roles()
        ]
