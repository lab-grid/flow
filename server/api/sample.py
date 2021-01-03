from flask import abort, request
from flask_restx import Resource, fields, Namespace

from functools import wraps

from server import app, db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, delete_policy, get_policies
from database import versioned_row_to_dict, json_row_to_dict, strip_metadata, Sample, SampleVersion

from api.utils import change_allowed, success_output, add_owner, add_updator


api = Namespace('samples', description='Extra-Simple operations on samples.', path='/')


sample_input = api.model('SampleInput', {})
sample_output = api.model('SampleOutput', { 'id': fields.Integer() })
samples_output = api.model('SamplesOutput', {
    'samples': fields.List(fields.Nested(sample_output)),
    'page': fields.Integer(),
    'pageCount': fields.Integer(),
})


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


@api.route('/sample')
class SamplesResource(Resource):
    @api.doc(security='token', model=samples_output, params={'page': page_param, 'per_page': per_page_param})
    @requires_auth
    @requires_scope('read:samples')
    def get(self):
        results = {}
        if request.args.get('page') is not None or request.args.get('per_page') is not None:
            page = int(request.args.get('page')) if request.args.get('page') else 1
            per_page = int(request.args.get('per_page')) if request.args.get('per_page') else 20
            page_query = Sample.query.filter(Sample.is_deleted != True).paginate(page=page, per_page=per_page)
            results['page'] = page_query.page
            results['pageCount'] = page_query.pages
            query = page_query.items
        else:
            query = Sample.query.filter(Sample.is_deleted != True).all()

        results['samples'] = [
            versioned_row_to_dict(api, sample, sample.current)
            for sample
            in query
            if check_access(path=f"/run/{str(sample.run_version.run_id)}", method="GET")
        ]
        return results


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
            return versioned_row_to_dict(api, sample_version.sample, sample_version)
        
        sample = Sample.query.get(sample_id)
        if (not sample) or sample.is_deleted:
            abort(404)
            return
        return versioned_row_to_dict(api, sample, sample.current)

    @api.doc(security='token', model=sample_output, body=sample_input)
    @requires_auth
    @requires_scope('write:samples')
    @requires_access()
    def put(self, sample_id):
        sample_dict = request.json
        sample = Sample.query.get(sample_id)
        if not sample or sample.is_deleted:
            abort(404)
            return
        if not change_allowed(versioned_row_to_dict(api, sample, sample.current), sample_dict):
            abort(403)
            return
        sample_version = SampleVersion(data=strip_metadata(sample_dict), server_version=app.config['SERVER_VERSION'])
        sample_version.sample = sample
        add_updator(sample_version)
        sample.current = sample_version
        db.session.add(sample_version)
        db.session.commit()
        return versioned_row_to_dict(api, sample, sample.current)
