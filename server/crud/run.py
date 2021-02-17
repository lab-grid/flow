from sqlalchemy.orm import Session, Query
from typing import Optional, List
from functools import reduce

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
)
from api.utils import paginatify


def all_runs(db: Session, include_archived=False) -> Query:
    query = db.query(Run)
    if not include_archived:
        query = query.filter(Run.is_deleted != True)
    return query

def all_samples(db: Session, run: Run, include_archived=False) -> Query:
    query = db.query(Sample)\
        .filter(Sample.run_version_id == run.version_id)
    if not include_archived:
        query = query\
            .filter(Sample.is_deleted != True)
    return query

def crud_get_runs(
    item_to_dict,

    db: Session,
    current_user: Auth0ClaimsPatched,

    protocol: Optional[int] = None,
    plate: Optional[str] = None,
    reagent: Optional[str] = None,
    sample: Optional[str] = None,
    creator: Optional[str] = None,
    archived: Optional[bool] = None,
    page: Optional[int] = None,
    per_page: Optional[int] = None,
) -> List[dict]:
    runs_queries = []

    # Add filter specific queries. These will be intersected later on.
    if protocol:
        runs_queries.append(
            all_runs(db, archived)\
                .join(ProtocolVersion, ProtocolVersion.id == Run.protocol_version_id)\
                .filter(ProtocolVersion.protocol_id == protocol)
        )
    if plate:
        run_version_query = all_runs(db, archived)\
            .join(RunVersion, RunVersion.id == Run.version_id)
        runs_subquery = filter_by_plate_label(run_version_query, plate)
        runs_queries.append(runs_subquery)
    if reagent:
        run_version_query = all_runs(db, archived)\
            .join(RunVersion, RunVersion.id == Run.version_id)
        runs_subquery = filter_by_reagent_label(run_version_query, reagent)
        runs_queries.append(runs_subquery)
    if sample:
        run_version_query = all_runs(db, archived)\
            .join(RunVersion, RunVersion.id == Run.version_id)
        runs_subquery = filter_by_sample_label(run_version_query, sample)
        runs_queries.append(runs_subquery)
    if creator:
        runs_queries.append(
            all_runs(db, archived)\
                # .filter(Run.id == run)
                .filter(Run.created_by == creator)
        )

    # Add a basic non-deleted items query if no filters were specified.
    if len(runs_queries) == 0:
        runs_queries.append(all_runs(db, archived))

    # Only return the intersection of all queries.
    runs_query = reduce(lambda a, b: a.intersect(b), runs_queries)

    return paginatify(
        items_label='runs',
        items=[
            run
            for run
            in runs_query.distinct().order_by(Run.created_on.desc())
            if check_access(user=current_user.username, path=f"/run/{str(run.id)}", method="GET") and run and run.current
        ],
        item_to_dict=item_to_dict,
        page=page,
        per_page=per_page,
    )

def crud_get_run(
    item_to_dict,

    db: Session,
    current_user: Auth0ClaimsPatched,

    run_id: int,
    version_id: Optional[int] = None,
) -> dict:
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    if version_id:
        run_version = db.query(RunVersion)\
            .filter(RunVersion.id == version_id)\
            .filter(Run.id == run_id)\
            .first()
        if (not run_version) or run_version.run.is_deleted:
            raise HTTPException(status_code=404, detail='Run Not Found')
        return item_to_dict(run_version.run)
    
    run = db.query(Run).get(run_id)
    if (not run) or run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')

    return item_to_dict(run)


def crud_get_run_samples(
    item_to_dict,

    db: Session,
    current_user: Auth0ClaimsPatched,

    run_id: Optional[int] = None,
    protocol: Optional[int] = None,
    plate: Optional[str] = None,
    reagent: Optional[str] = None,
    creator: Optional[str] = None,
    archived: Optional[bool] = None,
    page: Optional[int] = None,
    per_page: Optional[int] = None,
) -> List[dict]:
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')
    run = db.query(Run).get(run_id)
    if not run or run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')

    samples_queries = []

    # Add filter specific queries. These will be intersected later on.
    if protocol:
        samples_queries.append(
            all_samples(db, run, archived)\
                .join(ProtocolVersion, ProtocolVersion.id == Sample.protocol_version_id)\
                .filter(ProtocolVersion.protocol_id == protocol)
        )
    if plate:
        samples_queries.append(
            all_samples(db, run, archived)\
                .filter(Sample.plate_id == plate)
        )
    if reagent:
        run_version_query = all_samples(db, run, archived)\
            .join(RunVersion, RunVersion.id == Sample.run_version_id)
        samples_subquery = filter_by_reagent_label(run_version_query, reagent)
        samples_queries.append(samples_subquery)
    if creator:
        samples_queries.append(
            all_samples(db, run, archived)\
                .filter(Sample.created_by == creator)
        )

    # Add a basic non-deleted items query if no filters were specified.
    if len(samples_queries) == 0:
        samples_queries.append(all_samples(db, run, archived))

    # Only return the intersection of all queries.
    samples_query = reduce(lambda a, b: a.intersect(b), samples_queries)

    return paginatify(
        items_label='samples',
        items=[
            sample
            for sample
            in samples_query.distinct().order_by(Sample.sample_id.asc())
        ],
        item_to_dict=item_to_dict,
        page=page,
        per_page=per_page,
    )

def crud_get_run_sample(
    item_to_dict,

    db: Session,
    current_user: Auth0ClaimsPatched,

    run_id: int,
    sample_id: str,
    version_id: Optional[int] = None,
) -> dict:
    if not check_access(user=current_user.username, path=f"/run/{str(run_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')
    run = db.query(Run).get(run_id)
    if not run or run.is_deleted:
        raise HTTPException(status_code=404, detail='Run Not Found')
    sample = db.query(Sample)\
        .filter(Sample.run_version_id == run.version_id)\
        .filter(Sample.sample_id == sample_id)\
        .first()
    return item_to_dict(sample)
