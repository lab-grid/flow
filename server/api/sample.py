from functools import reduce, wraps
from typing import Optional

from fastapi import Depends, HTTPException
from server import Auth0ClaimsPatched
from sqlalchemy.orm import Session

from server import app, get_db, get_current_user
from settings import settings
from authorization import check_access, add_policy, delete_policy, get_policies
from database import filter_by_plate_label, filter_by_reagent_label, filter_by_sample_label, versioned_row_to_dict, json_row_to_dict, strip_metadata, run_to_sample, Sample, SampleVersion, Run, RunVersion
from models import SampleResult, SampleResults, SuccessResponse, success

from api.utils import change_allowed, add_owner, add_updator, paginatify

from crud.sample import crud_get_samples, crud_get_sample


@app.get('/sample', tags=['samples'], response_model=SampleResults, response_model_exclude_none=True)
async def get_samples(
    protocol: Optional[int] = None,
    run: Optional[int] = None,
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
    return crud_get_samples(
        item_to_dict=lambda sample: run_to_sample(sample),

        db=db,
        current_user=current_user,
        
        protocol=protocol,
        run=run,
        plate=plate,
        reagent=reagent,
        sample=sample,
        creator=creator,
        archived=archived,
        page=page,
        per_page=per_page,
    )

@app.get('/sample/{sample_id}', tags=['samples'], response_model=SampleResult, response_model_exclude_none=True)
async def get_sample(
    sample_id: str,
    plate_id: str,
    run_version_id: int,
    protocol_version_id: int,

    version_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Auth0ClaimsPatched = Depends(get_current_user),
):
    return crud_get_sample(
        item_to_dict=lambda sample: run_to_sample(sample),

        db=db,
        current_user=current_user,

        sample_id=sample_id,
        plate_id=plate_id,
        run_version_id=run_version_id,
        protocol_version_id=protocol_version_id,
        version_id=version_id,
    )

@app.put('/sample/{sample_id}', tags=['samples'], response_model=SampleResult, response_model_exclude_none=True)
async def update_sample(sample_id: str, sample: SampleResult, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    sample_dict = sample.dict()
    new_sample = db.query(Sample).get(sample_id)
    if not new_sample or new_sample.is_deleted:
        abort(404)
        return
    if not change_allowed(run_to_sample(new_sample), sample_dict):
        abort(403)
        return
    new_sample_version = SampleVersion(data=strip_metadata(sample_dict), server_version=settings.server_version)
    new_sample_version.sample = new_sample
    add_updator(new_sample_version, current_user.username)
    new_sample.current = new_sample_version
    db.session.add(new_sample_version)
    db.session.commit()
    return run_to_sample(new_sample)
