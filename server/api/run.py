import copy
import io
import jsonpatch
import re
import logging

from functools import reduce, wraps
from typing import List, Optional, Any

from fastapi import Depends, HTTPException, File, UploadFile, Request
from fastapi.responses import StreamingResponse
from fastapi_utils.timing import add_timing_middleware, record_timing
from server import Auth0ClaimsPatched
from sqlalchemy.orm import Session
from sqlalchemy.orm.session import make_transient

from server import app, get_db, get_current_user
from settings import settings
from authorization import check_access, add_policy, delete_policy, get_policies, get_roles
from database import filter_by_plate_label, filter_by_reagent_label, filter_by_sample_label, versioned_row_to_dict, json_row_to_dict, strip_metadata, Run, RunVersion, Protocol, run_to_sample, Sample, SampleVersion, Attachment
from models import AttachmentModel, SampleResult, SampleResults, Policy, RunModel, RunsModel, SuccessResponse, success
from pydantic_jsonpatch.jsonpatch import JSONPatch
from pydantic import BaseModel

from api.utils import change_allowed, add_owner, add_updator, paginatify

from crud.run import crud_get_runs, crud_get_run, crud_get_run_samples, crud_get_run_sample


logger = logging.getLogger(__name__)


def run_to_dict(run, run_version, include_large_fields=True):
    run_dict = versioned_row_to_dict(run, run_version, include_large_fields)
    run_dict['protocol'] = versioned_row_to_dict(run.protocol_version.protocol, run.protocol_version, include_large_fields)
    return run_dict


def extract_protocol_id(run_dict):
    if 'protocol' in run_dict and 'id' in run_dict['protocol']:
        return int(run_dict['protocol']['id'])
    if 'protocol_id' in run_dict:
        return int(run_dict['protocol_id'])
    return None


def get_samples(run_version, protocol_version):
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

            if block['type'] == 'plate-sampler' and 'plates' in block and block['plates'] is not None:
                for plate_mapping in block['plates']:
                    if plate_mapping is None:
                        continue

                    plate_id = plate_mapping.get('label')
                    if 'coordinates' in plate_mapping:
                        for plate_sample in plate_mapping['coordinates']:
                            if not plate_sample or 'sampleLabel' not in plate_sample:
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
                                server_version=settings.server_version,
                            )
                            sample.run_version = run_version
                            sample.protocol_version_id = run_version.run.protocol_version_id
                            sample.current = sample_version
                            samples.append(sample)
            if block['type'] == 'end-plate-sequencer' and 'plateSequencingResults' in block and block['plateSequencingResults'] is not None:
                for result in block['plateSequencingResults']:
                    results[f"{result['marker1']}-{result['marker2']}"] = result

    if protocol_version.data['sections']:
        for section in protocol_version.data['sections']:
            if 'blocks' not in section:
                continue
            for block in section['blocks']:
                if block['type'] == 'end-plate-sequencer' and 'plateMarkers' in block and block['plateMarkers'] is not None:
                    for marker in block['plateMarkers']:
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
        if 'classification' in result:
            sample.current.data['result'] = result['classification']

    return samples

def all_samples(db: Session, run, include_archived=False):
    query = db.query(Sample)\
        .filter(Sample.run_version_id == run.version_id)
    if not include_archived:
        query = query\
            .filter(Sample.is_deleted != True)
    return query

def clone_model(db: Session, model, **kwargs):
    db.expunge(model)
    make_transient(model)
    for (field, value) in kwargs.items():
        setattr(model, field, value)
    return model


@app.get('/run', tags=['runs'], response_model=RunsModel, response_model_exclude_none=True)
async def get_runs(
    protocol: Optional[int] = None,
    plate: Optional[str] = None,
    reagent: Optional[str] = None,
    sample: Optional[str] = None,
    creator: Optional[str] = None,
    archived: Optional[bool] = None,
    page: Optional[int] = None,
    per_page: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Auth0ClaimsPatched = Depends(get_current_user)
):
    return crud_get_runs(
        item_to_dict=lambda run: run_to_dict(run, run.current, include_large_fields=False),

        db=db,
        current_user=current_user,

        protocol=protocol,
        plate=plate,
        reagent=reagent,
        sample=sample,
        creator=creator,
        archived=archived,

        page=page,
        per_page=per_page,
    )

@app.post('/run', tags=['runs'], response_model=RunModel, response_model_exclude_none=True)
async def create_run(run: RunModel, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    run_dict = run.dict()
    protocol_id = extract_protocol_id(run_dict)
    run_dict.pop('protocol', None)
    if not protocol_id:
        raise HTTPException(status_code=400, detail='Invalid Protocol ID')
    protocol = db.query(Protocol).get(protocol_id)
    if not protocol:
        raise HTTPException(status_code=400, detail='Invalid Protocol (Not Found)')
    new_run = Run()
    new_run_version = RunVersion(data=strip_metadata(run_dict), server_version=settings.server_version)
    new_run_version.run = new_run
    new_run.current = new_run_version
    new_run.protocol_version_id = protocol.version_id
    add_owner(new_run, current_user.username)
    db.add_all([new_run, new_run_version])
    samples = get_samples(new_run_version, protocol.current)
    if samples:
        for sample in samples:
            db.merge(sample)
    db.commit()
    add_policy(user=current_user.username, path=f"/run/{str(new_run.id)}", method="GET")
    add_policy(user=current_user.username, path=f"/run/{str(new_run.id)}", method="PUT")
    add_policy(user=current_user.username, path=f"/run/{str(new_run.id)}", method="DELETE")
    return run_to_dict(new_run, new_run_version)

@app.get('/run/{run_id}', tags=['runs'], response_model=RunModel, response_model_exclude_none=True)
async def get_run(run_id: int, version_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    return crud_get_run(
        item_to_dict=lambda run: run_to_dict(run, run.current),

        db=db,
        current_user=current_user,

        run_id=run_id,
        version_id=version_id,
    )

@app.put('/run/{run_id}', tags=['runs'], response_model=RunModel, response_model_exclude_none=True)
async def update_run(run_id: int, run: RunModel, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    run_dict = run.dict()
    # This field shouldn't be updated by users.
    run_dict.pop('protocol', None)
    new_run = db.query(Run).get(run_id)
    if not new_run or new_run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')
    if not change_allowed(run_to_dict(new_run, new_run.current), run_dict):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')
    new_run_version = RunVersion(data=strip_metadata(run_dict), server_version=settings.server_version)
    new_run_version.run = new_run
    add_updator(new_run_version, current_user.username)
    new_run.current = new_run_version
    db.add(new_run_version)
    samples = get_samples(new_run_version, new_run.protocol_version)
    if samples:
        for sample in samples:
            db.merge(sample)
    db.commit()
    return run_to_dict(new_run, new_run.current)

@app.patch('/run/{run_id}', tags=['runs'], response_model=RunModel, response_model_exclude_none=True)
async def patch_run(request: Request, run_id: int, patch: list, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    new_run = db.query(Run).get(run_id)
    original_run_version = new_run.current
    if not new_run or new_run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')

    record_timing(request, note=f"Fetched run {run_id}")

    run_dict = versioned_row_to_dict(new_run, new_run.current)
    run_dict.pop('protocol', None)
    json_patch = jsonpatch.JsonPatch(patch)
    run_dict.pop('protocol', None)
    run_dict = json_patch.apply(run_dict)

    if not change_allowed(run_to_dict(new_run, new_run.current), run_dict):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    new_run_version = RunVersion(data=strip_metadata(run_dict), server_version=settings.server_version)
    new_run_version.run = new_run
    add_updator(new_run_version, current_user.username)
    original_run_version = new_run.current
    new_run.current = new_run_version
    db.add(new_run_version)
    db.commit()

    record_timing(request, note=f"Saved changes to run {run_id}")

    samples_dirty = False
    for operation in patch:
        operation_path = operation.get('path', '')
        # Check for changes to the path: /sections/*/blocks/*/plates
        if re.search("^/(sections/([^/]+/(blocks/([^/]+/(plates(/.*)?)?)?)?)?)?$", operation_path):
            samples_dirty = True
            break
        # Check for changes to the path: /sections/*/blocks/*/plateSequencingResults
        if re.search("^/(sections/([^/]+/(blocks/([^/]+/(plateSequencingResults(/.*)?)?)?)?)?)?$", operation_path):
            samples_dirty = True
            break
        # Check for changes to the path: /protocol/sections/*/blocks/*/plateMarkers
        if re.search("^/(protocol/(sections/([^/]+/(blocks/([^/]+/(plateMarkers(/.*)?)?)?)?)?)?)?$", operation_path):
            samples_dirty = True
            break

    if samples_dirty:
        logger.info("======================================")
        logger.info(f"Regenerating samples for run_version: ({new_run.id}, {new_run_version.id})")
        samples = get_samples(new_run_version, new_run.protocol_version)

        record_timing(request, note=f"Regenerated run {new_run.id} samples (len: {len(samples)})")

        if samples:
            for sample in samples:
                db.merge(sample)
        logger.info(f"Generated {len(samples)} samples for run_version: ({new_run.id}, {new_run_version.id})")
        logger.info("======================================")

        record_timing(request, note=f"Saved {len(samples)} regenerated samples to run {new_run.id}")
    else:
        logger.info("======================================")
        logger.info(f"Using old samples for run_version: ({new_run.id}, {new_run_version.id})")
        samples = db.query(Sample)\
            .filter(Sample.run_version_id == original_run_version.id)\
            .distinct()
        sample_count = 0
        for sample in samples:
            new_sample_version = clone_model(db, sample.current, run_version_id=new_run_version.id)
            new_sample = clone_model(db, sample, current=new_sample_version, run_version_id=new_run_version.id)
            db.merge(new_sample)
            sample_count += 1
        logger.info(f"Attached {sample_count} existing samples to run_version: ({new_run.id}, {new_run_version.id})")
        logger.info("======================================")

        record_timing(request, note=f"Attached {sample_count} existing samples to run {new_run.id}")

    db.commit()
    return run_to_dict(new_run, new_run.current)

@app.delete('/run/{run_id}', tags=['runs'], response_model=SuccessResponse, response_model_exclude_none=True)
async def delete_run(run_id: int, purge: bool = False, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="DELETE"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    run = db.query(Run).get(run_id)
    if not run or run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')
    if purge:
        db.delete(run)
    else:
        run.is_deleted = True
        # TODO: Mark all samples as deleted/archived?
    db.commit()
    delete_policy(path=f"/run/{str(run.id)}")
    return success


# Permissions -----------------------------------------------------------------

@app.get('/run/{run_id}/permission', tags=['runs'], response_model=List[Policy], response_model_exclude_none=True)
async def get_permissions(run_id: int, current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    return get_policies(path=f"/run/{run_id}")

@app.post('/run/{run_id}/permission/{method}/{user_id}', tags=['protocols'], response_model=Policy, response_model_exclude_none=True)
async def create_permission(run_id: int, method: str, user_id: str, current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    add_policy(user=user_id, path=f"/run/{run_id}", method=method)
    return success

@app.delete('/run/{run_id}/permission/{method}/{user_id}', tags=['protocols'], response_model=SuccessResponse, response_model_exclude_none=True)
async def delete_permission(run_id: int, method: str, user_id: str, current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    delete_policy(user=user_id, path=f"/run/{run_id}", method=method)
    return success


# Samples ---------------------------------------------------------------------

@app.get('/run/{run_id}/sample', tags=['runs'], response_model=SampleResults, response_model_exclude_none=True)
async def get_run_samples(
    run_id: Optional[int] = None,
    protocol: Optional[int] = None,
    plate: Optional[str] = None,
    reagent: Optional[str] = None,
    creator: Optional[str] = None,
    archived: Optional[bool] = None,
    page: Optional[int] = None,
    per_page: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Auth0ClaimsPatched = Depends(get_current_user)
):
    return crud_get_run_samples(
        item_to_dict=lambda sample: run_to_sample(sample),

        db=db,
        current_user=current_user,

        run_id=run_id,
        protocol=protocol,
        plate=plate,
        reagent=reagent,
        creator=creator,
        archived=archived,
        page=page,
        per_page=per_page,
    )

@app.get('/run/{run_id}/sample/{sample_id}', tags=['runs'], response_model=SampleResults, response_model_exclude_none=True)
async def get_run_sample(run_id: int, sample_id: str, version_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    return crud_get_run_sample(
        item_to_dict=lambda sample: run_to_sample(sample),

        db=db,
        current_user=current_user,

        run_id=run_id,
        sample_id=sample_id,
        version_id=version_id,
    )

@app.put('/run/{run_id}/sample/{sample_id}', tags=['runs'], response_model=SampleResults, response_model_exclude_none=True)
async def update_run_sample(run_id: int, sample_id: str, sample: SampleResult, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    run = db.query(Run).get(run_id)
    if not run or run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')

    sample_dict = sample.dict()
    new_sample = db.query(Sample).filter(Sample.sample_version_id == new_sample.version_id).filter(Sample.sample_id == sample_id).first()
    if not new_sample or new_sample.is_deleted:
        raise HTTPException(status_code=404, detail='Sample Not Found')
    if not change_allowed(run_to_dict(run, run.current), {}):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')
    new_sample_version = SampleVersion(data=strip_metadata(sample_dict), server_version=settings.server_version)
    new_sample_version.sample = new_sample
    add_updator(new_sample_version, current_user.username)
    new_sample.current = new_sample_version
    db.add(new_sample_version)
    db.commit()
    return run_to_sample(new_sample)


# Attachments -----------------------------------------------------------------

@app.get('/run/{run_id}/attachment', tags=['runs'], response_model=List[AttachmentModel], response_model_exclude_none=True)
async def get_run_attachments(run_id: int, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    run = db.query(Run).get(run_id)
    if not run or run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')

    return [
        AttachmentModel(id=attachment.id, name=attachment.name)
        for attachment
        in run.attachments
        if check_access(user=current_user.username, path=f"/run/{str(run.id)}", method="GET") and attachment
    ]

@app.post('/run/{run_id}/attachment', tags=['runs'], response_model=AttachmentModel, response_model_exclude_none=True)
async def create_run_attachment(run_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')
    run = db.query(Run).get(run_id)
    if not run or run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')

    attachment = Attachment(
        name=file.filename,
        mimetype=file.content_type,
        data=await file.read(),
    )

    db.add(attachment)
    db.commit()
    return AttachmentModel(id=attachment.id, name=attachment.name)

@app.get('/run/{run_id}/attachment/{attachment_id}', tags=['runs'], response_model_exclude_none=True)
async def get_run_attachment(run_id: int, attachment_id: int, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')
    run = db.query(Run).get(run_id)
    if not run or run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')

    attachment = db.query(Attachment).get(attachment_id)
    if not attachment or attachment.is_deleted:
        raise HTTPException(status_code=404, detail='Attachment Not Found')

    return StreamingResponse(io.BytesIO(attachment.data), media_type=attachment.mimetype if attachment.mimetype else 'application/octet-stream')

@app.delete('/run/{run_id}/attachment/{attachment_id}', tags=['runs'], response_model=SuccessResponse, response_model_exclude_none=True)
async def delete_run_attachment(run_id: int, attachment_id: int, purge: bool = False, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')
    run = db.query(Run).get(run_id)
    if not run or run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')

    attachment = db.query(Attachment).get(attachment_id)
    if not attachment or attachment.is_deleted:
        raise HTTPException(status_code=404, detail='Attachment Not Found')
    if purge:
        db.delete(attachment)
    else:
        attachment.is_deleted = True
    db.commit()
    return success
