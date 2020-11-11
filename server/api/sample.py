import copy
from flask import abort, request
from flask_restx import Resource, fields, Namespace

from functools import wraps

from server import db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, delete_policy, get_policies
from database import versioned_row_to_dict, json_row_to_dict, strip_metadata, Sample, SampleVersion, Protocol

from api.utils import change_allowed, success_output


api = Namespace('samples', description='Extra-Simple operations on samples.', path='/')


sample_input = api.model('SampleInput', {})
sample_output = api.model('SampleOutput', { 'id': fields.Integer() })
samples_output = fields.List(fields.Nested(sample_output))


sample_id_param = {
    'description': 'Numeric ID for a sample',
    'in': 'path',
    'type': 'int'
}
version_id_param = {
    'description': 'Specify this query parameter to retrieve a specific sample version',
    'in': 'query',
    'type': 'int'
}
user_id_param = {
    'description': 'String identifier for a user account',
    'in': 'path',
    'type': 'string'
}
method_param = {
    'description': 'Action identifier (GET|POST|PUT|DELETE)',
    'in': 'path',
    'type': 'string'
}


def sample_to_dict(sample, sample_version):
    sample_dict = versioned_row_to_dict(sample, sample_version)
    sample_dict['protocol'] = versioned_row_to_dict(sample.protocol_version.protocol, sample.protocol_version)
    return sample_dict


def extract_protocol_id(sample_dict):
    if 'protocol' in sample_dict and 'id' in sample_dict['protocol']:
        return int(sample_dict['protocol']['id'])
    if 'protocol_id' in sample_dict:
        return int(sample_dict['protocol_id'])
    return None


@api.route('/sample')
class SamplesResource(Resource):
    @api.doc(security='token', model=samples_output)
    @requires_auth
    @requires_scope('read:samples')
    def get(self):
        return [
            sample_to_dict(sample, sample.current)
            for sample
            in Sample.query.filter(Sample.is_deleted != True).all()
            if check_access(path=f"/sample/{str(sample.id)}", method="GET")
        ]

    @api.doc(security='token', model=sample_output, body=sample_input)
    @requires_auth
    @requires_scope('write:samples')
    # @requires_access()
    def post(self):
        sample_dict = request.json
        protocol_id = extract_protocol_id(sample_dict)
        sample_dict.pop('protocol', None)
        if not protocol_id:
            abort(400)
            return
        protocol = Protocol.query.get(protocol_id)
        if not protocol:
            abort(400)
            return
        sample = Sample()
        sample_version = SampleVersion(data=strip_metadata(sample_dict))
        sample_version.sample = sample
        sample.current = sample_version
        sample.protocol_version_id = protocol.version_id
        db.session.add_all([sample, sample_version])
        db.session.commit()
        add_policy(path=f"/sample/{str(sample.id)}", method="GET")
        add_policy(path=f"/sample/{str(sample.id)}", method="PUT")
        add_policy(path=f"/sample/{str(sample.id)}", method="DELETE")
        return sample_to_dict(sample, sample_version)


@api.route('/sample/<int:sample_id>')
@api.doc(params={'sample_id': sample_id_param})
class SampleResource(Resource):
    @api.doc(security='token', model=sample_output, params={'version_id': version_id_param})
    @requires_auth
    @requires_scope('read:samples')
    @requires_access()
    def get(self, sample_id):
        version_id = int(request.args.get('version_id')) if request.args.get('version_id') else None
        
        if version_id:
            sample_version = SampleVersion.query\
                .filter(SampleVersion.id == version_id)\
                .filter(Sample.id == sample_id)\
                .first()
            if (not sample_version) or sample_version.sample.is_deleted:
                abort(404)
                return
            return sample_to_dict(sample_version.sample, sample_version)
        
        sample = Sample.query.get(sample_id)
        if (not sample) or sample.is_deleted:
            abort(404)
            return
        return sample_to_dict(sample, sample.current)

    @api.doc(security='token', model=sample_output, body=sample_input)
    @requires_auth
    @requires_scope('write:samples')
    @requires_access()
    def put(self, sample_id):
        sample_dict = request.json
        # This field shouldn't be updated by users.
        sample_dict.pop('protocol', None)
        sample = Sample.query.get(sample_id)
        if not sample or sample.is_deleted:
            abort(404)
            return
        if not change_allowed(sample_to_dict(sample, sample.current), sample_dict):
            abort(403)
            return
        sample_version = SampleVersion(data=strip_metadata(sample_dict))
        sample_version.sample = sample
        sample.current = sample_version
        db.session.add(sample_version)
        db.session.commit()
        return sample_to_dict(sample, sample.current)

    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:samples')
    @requires_access()
    def delete(self, sample_id):
        sample = Sample.query.get(sample_id)
        if not sample or sample.is_deleted:
            abort(404)
            return
        sample.is_deleted = True
        db.session.commit()
        delete_policy(path=f"/sample/{str(sample.id)}")
        return {
            'success': True
        }


# Permissions -----------------------------------------------------------------


sample_permission_output = api.model('SamplePermissionOutput', {
    'user': fields.String(),
    'path': fields.String(),
    'method': fields.String()
})
sample_permissions_output = fields.List(fields.Nested(sample_permission_output))


def requires_permissions_access(method=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if check_access(path=f"/sample/{kwargs.get('sample_id')}", method=method):
                return f(*args, **kwargs)
            raise AuthError({
                'code': 'forbidden',
                'description': 'User is not allowed to perform this action'
            }, 403)
        return decorated
    return decorator


@api.route('/sample/<int:sample_id>/permission')
@api.doc(params={'sample_id': sample_id_param})
class SamplePermissionsResource(Resource):
    @api.doc(security='token', model=sample_permissions_output)
    @requires_auth
    @requires_scope('read:samples')
    @requires_permissions_access()
    def get(self, sample_id):
        return get_policies(path=f"/sample/{sample_id}")


@api.route('/sample/<int:sample_id>/permission/<string:method>/<string:user_id>')
@api.doc(params={'sample_id': sample_id_param, 'user_id': user_id_param, 'method': method_param})
class SamplePermissionResource(Resource):
    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:samples')
    @requires_permissions_access('PUT')
    def post(self, sample_id, method, user_id):
        add_policy(user=user_id, path=f"/sample/{sample_id}", method=method)
        return {
            'success': True
        }

    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:samples')
    @requires_permissions_access('PUT')
    def delete(self, sample_id, method, user_id):
        delete_policy(user=user_id, path=f"/sample/{sample_id}", method=method)
        return {
            'success': True
        }
