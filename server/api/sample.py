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


def all_samples(include_archived=False):
    query = Sample.query\
        .join(RunVersion, RunVersion.id == Sample.run_version_id)\
        .join(Run, Run.version_id == RunVersion.id)
    if not include_archived:
        query = query.filter(Sample.is_deleted != True)
    return query


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
    samples_queries = []

    # Add filter specific queries. These will be intersected later on.
    if protocol:
        samples_queries.append(
            all_samples(archived)\
                .join(ProtocolVersion, ProtocolVersion.id == Sample.protocol_version_id)\
                .filter(ProtocolVersion.protocol_id == protocol)
        )
    if run:
        samples_queries.append(
            all_samples(archived)\
                # .join(RunVersion, RunVersion.id == Sample.run_version_id)\
                .filter(RunVersion.run_id == run)
        )
    if plate:
        samples_queries.append(
            all_samples(archived)\
                .filter(Sample.plate_id == plate)
        )
    if reagent:
        run_version_query = all_samples(archived) # \
            # .join(RunVersion, RunVersion.id == Sample.run_version_id)
        samples_subquery = filter_by_reagent_label(run_version_query, reagent)
        samples_queries.append(samples_subquery)
    if sample:
        samples_queries.append(
            all_samples(archived)\
                .filter(Sample.sample_id == sample)
        )
    if creator:
        samples_queries.append(
            all_samples(archived)\
                .filter(Sample.created_by == creator)
        )

    # Add a basic non-deleted items query if no filters were specified.
    if len(samples_queries) == 0:
        samples_queries.append(all_samples(archived))

    # Only return the intersection of all queries.
    samples_query = reduce(lambda a, b: a.intersect(b), samples_queries)

    return paginatify(
        items_label='samples',
        items=[
            sample
            for sample
            in samples_query.distinct().order_by(Sample.created_on.desc())
            if check_access(user=current_user.username, path=f"/run/{str(sample.run_version.run_id)}", method="GET") and sample and sample.current
        ],
        item_to_dict=lambda sample: run_to_sample(sample),
        page=page,
        per_page=per_page,
    )

@app.get('/sample/{sample_id}', tags=['samples'], response_model=SampleResult, response_model_exclude_none=True)
async def get_sample(sample_id: str, version_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    sample = db.query(Sample).get(sample_id)
    if not check_access(user=current_user.username, path=f"/run/{str(sample.run_version.run_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')
    
    if version_id:
        sample_version = SampleVersion.query\
            .filter(SampleVersion.id == version_id)\
            .filter(Sample.id == sample_id)\
            .first()
        if (not sample_version) or sample_version.sample.is_deleted:
            raise HTTPException(status_code=404, detail='Sample Version Not Found')
        return run_to_sample(sample_version.sample)
    
    if (not sample) or sample.is_deleted:
        raise HTTPException(status_code=404, detail='Sample Not Found')
    return run_to_sample(sample)

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
