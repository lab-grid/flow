from sqlalchemy.orm import Session, Query
from typing import Optional, List
from functools import reduce
from fastapi import HTTPException

from authorization import check_access
from server import Auth0ClaimsPatched
from database import (
    filter_by_plate_label,
    filter_by_reagent_label,
    filter_by_sample_label,
    ProtocolVersion,
    Run,
    RunVersion,
    Sample,
    SampleVersion
)
from api.utils import paginatify


def all_samples(db: Session, include_archived=False) -> Query:
    query = db.query(Sample)\
        .join(RunVersion, RunVersion.id == Sample.run_version_id)\
        .join(Run, Run.version_id == RunVersion.id)
    if not include_archived:
        query = query.filter(Sample.is_deleted != True)
    return query


def crud_get_samples(
    item_to_dict,

    db: Session,
    current_user: Auth0ClaimsPatched,

    protocol: Optional[int] = None,
    run: Optional[int] = None,
    plate: Optional[str] = None,
    reagent: Optional[str] = None,
    sample: Optional[str] = None,
    creator: Optional[str] = None,
    archived: Optional[bool] = None,
    page: Optional[int] = None,
    per_page: Optional[int] = None,
) -> List[dict]:
    samples_queries = []

    # Add filter specific queries. These will be intersected later on.
    if protocol:
        samples_queries.append(
            all_samples(db, archived)\
                .join(ProtocolVersion, ProtocolVersion.id == Sample.protocol_version_id)\
                .filter(ProtocolVersion.protocol_id == protocol)
        )
    if run:
        samples_queries.append(
            all_samples(db, archived)\
                # .join(RunVersion, RunVersion.id == Sample.run_version_id)\
                .filter(RunVersion.run_id == run)
        )
    if plate:
        samples_queries.append(
            all_samples(db, archived)\
                .filter(Sample.plate_id == plate)
        )
    if reagent:
        run_version_query = all_samples(db, archived) # \
            # .join(RunVersion, RunVersion.id == Sample.run_version_id)
        samples_subquery = filter_by_reagent_label(run_version_query, reagent)
        samples_queries.append(samples_subquery)
    if sample:
        samples_queries.append(
            all_samples(db, archived)\
                .filter(Sample.sample_id == sample)
        )
    if creator:
        samples_queries.append(
            all_samples(db, archived)\
                .filter(Sample.created_by == creator)
        )

    # Add a basic non-deleted items query if no filters were specified.
    if len(samples_queries) == 0:
        samples_queries.append(all_samples(db, archived))

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
        item_to_dict=item_to_dict,
        page=page,
        per_page=per_page,
    )

def crud_get_sample(
    item_to_dict,

    db: Session,
    current_user: Auth0ClaimsPatched,

    sample_id: str,
    plate_id: str,
    run_version_id: int,
    protocol_version_id: int,
    version_id: Optional[int] = None,
) -> dict:
    sample = db.query(Sample).get(sample_id)
    if not check_access(user=current_user.username, path=f"/run/{str(sample.run_version.run_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    if version_id:
        sample_version = SampleVersion.query\
            .filter(SampleVersion.id == version_id)\
            .filter(Sample.id == sample_id)\
            .first()
        if (not sample_version) or sample_version.sample.is_deleted:
            raise HTTPException(status_code=404, detail='Sample Not Found')
        return item_to_dict(sample_version.sample)

    sample = db.query(Sample).get((sample_id, plate_id, run_version_id, protocol_version_id))
    if (not sample) or sample.is_deleted:
        raise HTTPException(status_code=404, detail='Sample Not Found')
    return item_to_dict(sample)
