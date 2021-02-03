import copy
from flask import abort, request
from flask_restx import Resource, fields, Namespace

from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from functools import reduce, wraps

from server import app, db
from authorization import AuthError, requires_auth, requires_scope, requires_access, check_access, add_policy, delete_policy, get_policies, get_roles
from database import filter_by_plate_label, filter_by_reagent_label, filter_by_sample_label, versioned_row_to_dict, json_row_to_dict, strip_metadata, Run, RunVersion, Protocol, run_to_sample, Sample, SampleVersion, Attachment

from api.utils import change_allowed, success_output, add_owner, add_updator, attachment_id_param, run_id_param, version_id_param, purge_param, user_id_filter_param, method_filter_param, user_id_param, method_param, sample_id_param, protocol_param, plate_param, sample_param, reagent_param, creator_param, archived_param, page_param, per_page_param, paginatify


api = Namespace('runs', description='Extra-Simple operations on runs.', path='/')


upload_parser = api.parser()
upload_parser.add_argument(
    'file',
    location='files',
    type=FileStorage,
    required=True
)


run_input = api.model('RunInput', {})
run_output = api.model('RunOutput', { 'id': fields.Integer() })
runs_output = api.model('RunsOutput', {
    'runs': fields.List(fields.Nested(run_output)),
    'page': fields.Integer(),
    'pageCount': fields.Integer(),
})
sample_input = api.model('SampleInput', {})
sample_output = api.model('SampleOutput', { 'sampleID': fields.Integer() })
samples_output = api.model('SamplesOutput', {
    'samples': fields.List(fields.Nested(sample_output)),
    'page': fields.Integer(),
    'pageCount': fields.Integer(),
})
attachment_output = api.model('AttachmentOutput', {
    'id': fields.Integer(),
    'name': fields.String(),
})
attachments_output = fields.List(fields.Nested(attachment_output))


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


def get_samples(run, run_version):
    samples = []
    markers = {}
    results = {}
    signers = []
    witnesses = []
    lots = []
    if not run_version.data['sections']:
        return samples
    for section in run_version.data['sections']:
        if 'signature' in section:
            signers.append(section['signature'])
        if 'witness' in section:
            witnesses.append(section['witness'])

        if 'blocks' not in section:
            continue
        for block in section['blocks']:
            if 'plateLot' in block:
                lots.append(block['plateLot'])

            if block['type'] == 'plate-sampler' and 'plates' in block:
                for plate_mapping in block['plates']:
                    if plate_mapping is None:
                        continue

                    plate_id = plate_mapping.get('label')
                    if 'coordinates' in plate_mapping:
                        for plate_samples in plate_mapping['coordinates']:
                            if not plate_samples:
                                continue
                            for plate_sample in plate_samples:
                                if 'sampleLabel' not in plate_sample:
                                    continue
                                sample = Sample(
                                    sample_id=f"{plate_sample['sampleLabel']}",
                                    plate_id=plate_id,
                                )
                                sample_version = SampleVersion(
                                    data={
                                        'plateRow': plate_sample['row'],
                                        'plateCol': plate_sample['col'],
                                        'plateIndex': plate_sample['plateIndex'],
                                    },
                                    sample=sample,
                                    server_version=app.config['SERVER_VERSION'],
                                )
                                sample.run_version = run_version
                                sample.protocol_version_id = run.protocol_version_id
                                sample.current = sample_version
                                samples.append(sample)
            if block['type'] == 'end-plate-sequencer' and 'plateSequencingResults' in block:
                for result in block['plateSequencingResults']:
                    results[f"{result['marker1']}-{result['marker2']}"] = result
            if block['type'] == 'end-plate-sequencer' and 'definition' in block and 'plateMarkers' in block['definition']:
                for marker in block['definition']['plateMarkers'].values():
                    markers[f"{marker['plateIndex']}-{marker['plateRow']}-{marker['plateColumn']}"] = marker
    for sample in samples:
        sample.current.data['signers'] = signers
        sample.current.data['witnesses'] = witnesses
        sample.current.data['plateLots'] = lots

        marker = markers.get(f"{sample.current.data['plateIndex']}-{sample.current.data['plateRow']}-{sample.current.data['plateCol']}", None)
        if not marker:
            continue
        sample.current.data['marker1'] = marker['marker1']
        sample.current.data['marker2'] = marker['marker2']

        result = results.get(f"{marker['marker1']}-{marker['marker2']}", None)
        if not result:
            continue
        sample.current.data['result'] = result['classification']

def all_runs(include_archived=False):
    query = Run.query
    if not include_archived:
        query = query.filter(Run.is_deleted != True)
    return query

def all_samples(run, include_archived=False):
    query = Sample.query
    if not include_archived:
        query = query\
            .filter(Sample.is_deleted != True)\
            .filter(Sample.run_version_id == run.version_id)
    return query


@api.route('/run')
class RunsResource(Resource):
    @api.doc(security='token', model=runs_output, params={
        'protocol': protocol_param,
        'plate': plate_param,
        'sample': sample_param,
        'reagent': reagent_param,
        'creator': creator_param,
        'archived': archived_param,
        'page': page_param,
        'per_page': per_page_param,
    })
    @requires_auth
    @requires_scope('read:runs')
    def get(self):
        protocol = int(request.args.get('protocol')) if request.args.get('protocol') else None
        plate = request.args.get('plate')
        reagent = request.args.get('reagent')
        sample = request.args.get('sample')
        creator = request.args.get('creator')
        archived = request.args.get('archived') == 'true' if request.args.get('archived') else False

        runs_queries = []

        # Add filter specific queries. These will be intersected later on.
        if protocol:
            runs_queries.append(
                all_runs(archived)\
                    .join(ProtocolVersion, ProtocolVersion.id == Run.protocol_version_id)\
                    .filter(ProtocolVersion.protocol_id == protocol)
            )
        if plate:
            run_version_query = all_runs(archived)\
                .join(RunVersion, RunVersion.id == Run.version_id)
            runs_subquery = filter_by_plate_label(run_version_query, plate)
            runs_queries.append(runs_subquery)
        if reagent:
            run_version_query = all_runs(archived)\
                .join(RunVersion, RunVersion.id == Run.version_id)
            runs_subquery = filter_by_reagent_label(run_version_query, reagent)
            runs_queries.append(runs_subquery)
        if sample:
            run_version_query = all_runs(archived)\
                .join(RunVersion, RunVersion.id == Run.version_id)
            runs_subquery = filter_by_sample_label(run_version_query, sample)
            runs_queries.append(runs_subquery)
        if creator:
            runs_queries.append(
                all_runs(archived)\
                    # .filter(Run.id == run)
                    .filter(Run.created_by == creator)
            )

        # Add a basic non-deleted items query if no filters were specified.
        if len(runs_queries) == 0:
            runs_queries.append(all_runs(archived))

        # Only return the intersection of all queries.
        runs_query = reduce(lambda a, b: a.intersect(b), runs_queries)

        return paginatify(
            items_label='runs',
            items=[
                run
                for run
                in runs_query.distinct().order_by(Run.created_on.desc())
                if check_access(path=f"/run/{str(run.id)}", method="GET") and run and run.current
            ],
            item_to_dict=lambda run: run_to_dict(run, run.current),
        )


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
        run_version = RunVersion(data=strip_metadata(run_dict), server_version=app.config['SERVER_VERSION'])
        run_version.run = run
        run.current = run_version
        run.protocol_version_id = protocol.version_id
        add_owner(run)
        db.session.add_all([run, run_version])
        samples = get_samples(run, run_version)
        if samples:
            for sample in samples:
                db.session.merge(sample)
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
        run_version = RunVersion(data=strip_metadata(run_dict), server_version=app.config['SERVER_VERSION'])
        run_version.run = run
        add_updator(run_version)
        run.current = run_version
        db.session.add(run_version)
        samples = get_samples(run, run_version)
        if samples:
            for sample in samples:
                db.session.merge(sample)
        db.session.commit()
        return run_to_dict(run, run.current)

    @api.doc(security='token', model=success_output, params={'purge': purge_param})
    @requires_auth
    @requires_scope('write:runs')
    @requires_access()
    def delete(self, run_id):
        purge = request.args.get('purge') == 'true' if request.args.get('purge') else False

        run = Run.query.get(run_id)
        if not run or run.is_deleted:
            abort(404)
            return
        if purge:
            db.session.delete(run)
        else:
            run.is_deleted = True
            # TODO: Mark all samples as deleted/archived?
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
@api.doc(params={'run_id': run_id_param, 'user_id_filter': user_id_filter_param, 'method_filter': method_filter_param})
class RunPermissionsResource(Resource):
    @api.doc(security='token', model=run_permissions_output)
    @requires_auth
    @requires_scope('read:runs')
    @requires_permissions_access()
    def get(self, run_id):
        user_id = request.args.get('user_id')
        method = request.args.get('method')

        policies = get_policies(path=f"/run/{run_id}") + get_policies(path="/run/*")

        if user_id:
            user_roles = get_roles(user_id)
            policies = filter(lambda policy: policy['user'] == user_id or policy['user'] in user_roles, policies)
        if method:
            policies = filter(lambda policy: policy['method'] == method, policies)

        return [policy for policy in policies]


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
    @api.doc(security='token', model=samples_output, params={'page': page_param, 'per_page': per_page_param})
    @requires_auth
    @requires_scope('read:runs')
    def get(self, run_id):
        if not check_access(path=f"/run/{str(run_id)}", method="GET"):
            abort(403)
            return
        run = Run.query.get(run_id)
        if not run or run.is_deleted:
            abort(404)
            return

        protocol = int(request.args.get('protocol')) if request.args.get('protocol') else None
        plate = request.args.get('plate')
        reagent = request.args.get('reagent')
        creator = request.args.get('creator')
        archived = request.args.get('archived') == 'true' if request.args.get('archived') else False

        samples_queries = []

        # Add filter specific queries. These will be intersected later on.
        if protocol:
            samples_queries.append(
                all_samples(run, archived)\
                    .join(ProtocolVersion, ProtocolVersion.id == Sample.protocol_version_id)\
                    .filter(ProtocolVersion.protocol_id == protocol)
            )
        if plate:
            samples_queries.append(
                all_samples(run, archived)\
                    .filter(Sample.plate_id == plate)
            )
        if reagent:
            run_version_query = all_samples(run, archived)\
                .join(RunVersion, RunVersion.id == Sample.run_version_id)
            samples_subquery = filter_by_reagent_label(run_version_query, reagent)
            samples_queries.append(samples_subquery)
        if creator:
            samples_queries.append(
                all_samples(run, archived)\
                    .filter(Sample.created_by == creator)
            )

        # Add a basic non-deleted items query if no filters were specified.
        if len(samples_queries) == 0:
            samples_queries.append(all_samples(run, archived))

        # Only return the intersection of all queries.
        samples_query = reduce(lambda a, b: a.intersect(b), samples_queries)

        return paginatify(
            items_label='samples',
            items=[
                sample
                for sample
                in samples_query.distinct().order_by(Sample.sample_id.asc())
            ],
            item_to_dict=lambda sample: run_to_sample(sample),
        )


@api.route('/run/<int:run_id>/sample/<int:sample_id>')
@api.doc(params={'run_id': run_id_param, 'sample_id': sample_id_param})
class RunSampleResource(Resource):
    @api.doc(security='token', model=sample_output, params={'version_id': version_id_param})
    @requires_auth
    @requires_scope('read:runs')
    def get(self, run_id, sample_id):
        if not check_access(path=f"/run/{str(run_id)}", method="GET"):
            abort(403)
            return
        run = Run.query.get(run_id)
        if not run or run.is_deleted:
            abort(404)
            return
        sample = Sample.query.filter(Sample.run_version_id == run.version_id).filter(Sample.sample_id == sample_id).first()
        # sample = get_samples(run=run, run_version=run.current, sample_id=sample_id).first()
        return run_to_sample(sample)

    @api.doc(security='token', model=sample_output, body=sample_input)
    @requires_auth
    @requires_scope('write:runs')
    def put(self, run_id, sample_id):
        sample_dict = request.json
        # This field shouldn't be updated by users.
        # sample_dict.pop('protocol', None)
        sample = Sample.query.filter(Sample.sample_version_id == sample.version_id).filter(Sample.sample_id == sample_id).first()
        if not sample or sample.is_deleted:
            abort(404)
            return
        if not change_allowed(run_to_dict(run, run.current), {}):
            abort(403)
            return
        sample_version = SampleVersion(data=strip_metadata(sample_dict), server_version=app.config['SERVER_VERSION'])
        sample_version.sample = sample
        add_updator(sample_version)
        sample.current = sample_version
        db.session.add(sample_version)
        db.session.commit()
        return run_to_sample(sample)


# Attachments -----------------------------------------------------------------

@api.route('/run/<int:run_id>/attachment')
class RunAttachmentsResource(Resource):
    @api.doc(security='token', model=attachments_output)
    @requires_auth
    @requires_scope('read:runs')
    def get(self):
        if not check_access(path=f"/run/{str(run_id)}", method="GET"):
            abort(403)
            return
        run = Run.query.get(run_id)
        if not run or run.is_deleted:
            abort(404)
            return

        return [
            {
                'id': attachment.id,
                'name': attachment.name,
            }
            for attachment
            in run.attachments
            if check_access(path=f"/run/{str(run.id)}", method="GET") and attachment
        ]

    @api.doc(security='token', model=attachment_output)
    @requires_auth
    @requires_scope('write:runs')
    def post(self, run_id):
        if not check_access(path=f"/run/{str(run_id)}", method="GET"):
            abort(403)
            return
        run = Run.query.get(run_id)
        if not run or run.is_deleted:
            abort(404)
            return

        args = upload_parser.parse_args()
        uploaded_file = args['file']

        attachment = Attachment(
            name=secure_filename(uploaded_file.filename),
            mimetype=uploaded_file.content_type,
            data=uploaded_file.read(),
        )

        db.session.add(attachment)
        db.session.commit()
        return {
            'id': attachment.id,
            'name': attachment.name,
        }


@api.route('/run/<int:run_id>/attachment/<int:attachment_id>')
@api.doc(params={'attachment_id': attachment_id_param})
class RunAttachmentResource(Resource):
    @api.doc(security='token', model=attachment_output, params={'version_id': version_id_param})
    @requires_auth
    @requires_scope('read:runs')
    def get(self, run_id, attachment_id):
        if not check_access(path=f"/run/{str(run_id)}", method="GET"):
            abort(403)
            return
        run = Run.query.get(run_id)
        if not run or run.is_deleted:
            abort(404)
            return

        attachment = Attachment.query.get(attachment_id)
        if not attachment or attachment.is_deleted:
            abort(404)
            return

        return app.response_class(attachment.data, mimetype=attachment.mimetype if attachment.mimetype else 'application/octet-stream')

    @api.doc(security='token', model=success_output, params={'purge': purge_param})
    @requires_auth
    @requires_scope('write:runs')
    def delete(self, run_id, attachment_id):
        if not check_access(path=f"/run/{str(run_id)}", method="GET"):
            abort(403)
            return
        run = Run.query.get(run_id)
        if not run or run.is_deleted:
            abort(404)
            return

        purge = request.args.get('purge') == 'true' if request.args.get('purge') else False

        attachment = Attachment.query.get(attachment_id)
        if not attachment or attachment.is_deleted:
            abort(404)
            return
        if purge:
            db.session.delete(attachment)
        else:
            attachment.is_deleted = True
        db.session.commit()
        return {
            'success': True,
        }
