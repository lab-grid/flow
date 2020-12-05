import copy
from flask import abort, request
from flask_restx import Resource, fields, Namespace

from functools import wraps

from server import db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, delete_policy, get_policies
from database import versioned_row_to_dict, json_row_to_dict, strip_metadata, Run, RunVersion, Protocol, update_sample, get_samples, run_to_sample

from api.utils import change_allowed, success_output, add_owner, add_updator


api = Namespace('runs', description='Extra-Simple operations on runs.', path='/')


run_input = api.model('RunInput', {})
run_output = api.model('RunOutput', { 'id': fields.Integer() })
runs_output = fields.List(fields.Nested(run_output))
sample_input = api.model('SampleInput', {})
sample_output = api.model('SampleOutput', { 'sampleID': fields.Integer() })
samples_output = fields.List(fields.Nested(sample_output))


run_id_param = {
    'description': 'Numeric ID for a run',
    'in': 'path',
    'type': 'int'
}
version_id_param = {
    'description': 'Specify this query parameter to retrieve a specific run version',
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
sample_id_param = {
    'description': 'ID for a sample',
    'in': 'path',
    'type': 'string'
}


def run_to_dict(run, run_version):
    run_dict = versioned_row_to_dict(api, run, run_version)
    run_dict['protocol'] = versioned_row_to_dict(api, run.protocol_version.protocol, run.protocol_version)
    return run_dict


def extract_protocol_id(run_dict):
    if 'protocol' in run_dict and 'id' in run_dict['protocol']:
        return int(run_dict['protocol']['id'])
    if 'protocol_id' in run_dict:
        return int(run_dict['protocol_id'])
    return None


@api.route('/run')
class RunsResource(Resource):
    @api.doc(security='token', model=runs_output)
    @requires_auth
    @requires_scope('read:runs')
    def get(self):
        return [
            run_to_dict(run, run.current)
            for run
            in Run.query.filter(Run.is_deleted != True).all()
            if check_access(path=f"/run/{str(run.id)}", method="GET")
        ]

    @api.doc(security='token', model=run_output, body=run_input)
    @requires_auth
    @requires_scope('write:runs')
    # @requires_access()
    def post(self):
        run_dict = request.json
        protocol_id = extract_protocol_id(run_dict)
        run_dict.pop('protocol', None)
        if not protocol_id:
            abort(400)
            return
        protocol = Protocol.query.get(protocol_id)
        if not protocol:
            abort(400)
            return
        run = Run()
        run_version = RunVersion(data=strip_metadata(run_dict))
        run_version.run = run
        run.current = run_version
        run.protocol_version_id = protocol.version_id
        add_owner(run)
        db.session.add_all([run, run_version])
        db.session.commit()
        add_policy(path=f"/run/{str(run.id)}", method="GET")
        add_policy(path=f"/run/{str(run.id)}", method="PUT")
        add_policy(path=f"/run/{str(run.id)}", method="DELETE")
        return run_to_dict(run, run_version)


@api.route('/run/<int:run_id>')
@api.doc(params={'run_id': run_id_param})
class RunResource(Resource):
    @api.doc(security='token', model=run_output, params={'version_id': version_id_param})
    @requires_auth
    @requires_scope('read:runs')
    @requires_access()
    def get(self, run_id):
        version_id = int(request.args.get('version_id')) if request.args.get('version_id') else None

        if version_id:
            run_version = RunVersion.query\
                .filter(RunVersion.id == version_id)\
                .filter(Run.id == run_id)\
                .first()
            if (not run_version) or run_version.run.is_deleted:
                abort(404)
                return
            return run_to_dict(run_version.run, run_version)
        
        run = Run.query.get(run_id)
        if (not run) or run.is_deleted:
            abort(404)
            return
        return run_to_dict(run, run.current)

    @api.doc(security='token', model=run_output, body=run_input)
    @requires_auth
    @requires_scope('write:runs')
    @requires_access()
    def put(self, run_id):
        run_dict = request.json
        # This field shouldn't be updated by users.
        run_dict.pop('protocol', None)
        run = Run.query.get(run_id)
        if not run or run.is_deleted:
            abort(404)
            return
        if not change_allowed(run_to_dict(run, run.current), run_dict):
            abort(403)
            return
        run_version = RunVersion(data=strip_metadata(run_dict))
        run_version.run = run
        add_updator(run_version)
        run.current = run_version
        db.session.add(run_version)
        db.session.commit()
        return run_to_dict(run, run.current)

    @api.doc(security='token', model=success_output)
    @requires_auth
    @requires_scope('write:runs')
    @requires_access()
    def delete(self, run_id):
        run = Run.query.get(run_id)
        if not run or run.is_deleted:
            abort(404)
            return
        run.is_deleted = True
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
@api.doc(params={'run_id': run_id_param})
class RunPermissionsResource(Resource):
    @api.doc(security='token', model=run_permissions_output)
    @requires_auth
    @requires_scope('read:runs')
    @requires_permissions_access()
    def get(self, run_id):
        return get_policies(path=f"/run/{run_id}")


@api.route('/run/<int:run_id>/permission/<string:method>/<string:user_id>')
@api.doc(params={'run_id': run_id_param, 'user_id': user_id_param, 'method': method_param})
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


# Samples ---------------------------------------------------------------------


@api.route('/run/<int:run_id>/sample')
@api.doc(params={'run_id': run_id_param})
class RunSamplesResource(Resource):
    @api.doc(security='token', model=samples_output)
    @requires_auth
    @requires_scope('read:runs')
    def get(self, run_id):
        return [
            run_to_sample(sample)
            for sample
            in get_samples(run_id=run_id).distinct()
            if check_access(path=f"/run/{str(run_id)}", method="GET")
        ]


@api.route('/run/<int:run_id>/sample/<int:sample_id>')
@api.doc(params={'run_id': run_id_param, 'sample_id': sample_id_param})
class RunSampleResource(Resource):
    @api.doc(security='token', model=sample_output, params={'version_id': version_id_param})
    @requires_auth
    @requires_scope('read:runs')
    @requires_access()
    def get(self, run_id, sample_id):
        sample = get_samples(run_id=run_id, sample_id=sample_id).first()
        return run_to_sample(sample)

    @api.doc(security='token', model=success_output, body=sample_input)
    @requires_auth
    @requires_scope('write:runs')
    @requires_access()
    def put(self, run_id, sample_id):
        override_dict = request.json
        run = Run.query.get(run_id)
        if not run or run.is_deleted:
            abort(404)
            return
        if not change_allowed(run_to_dict(run, run.current), run_dict):
            abort(403)
            return
        update_sample(run, sample_id, override_dict)
        db.session.commit()
        return {
            'success': True
        }
