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
    Protocol,
    ProtocolVersion,
    Run,
    RunVersion,
    fix_plate_markers_protocol,
)
from api.utils import paginatify


def all_protocols(db: Session, include_archived=False) -> Query:
    query = db.query(Protocol)
    if not include_archived:
        query = query.filter(Protocol.is_deleted != True)
    return query


def crud_get_protocols(
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
    protocols_queries = []
    if protocol:
        protocols_queries.append(
            all_protocols(db, archived)\
                .filter(Protocol.id == protocol)
        )
    if run:
        protocols_queries.append(
            all_protocols(db, archived)\
                .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                .filter(Run.id == run)
        )
    if plate:
        run_version_query = all_protocols(db, archived)\
            .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
            .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
            .join(RunVersion, RunVersion.id == Run.version_id)
        protocols_subquery = filter_by_plate_label(run_version_query, plate)
        protocols_queries.append(protocols_subquery)
    if reagent:
        run_version_query = all_protocols(db, archived)\
            .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
            .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
            .join(RunVersion, RunVersion.id == Run.version_id)
        protocols_subquery = filter_by_reagent_label(run_version_query, reagent)
        protocols_queries.append(protocols_subquery)
    if sample:
        run_version_query = all_protocols(db, archived)\
            .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
            .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
            .join(RunVersion, RunVersion.id == Run.version_id)
        protocols_subquery = filter_by_sample_label(run_version_query, sample)
        protocols_queries.append(protocols_subquery)
    if creator:
        protocols_queries.append(
            all_protocols(db, archived)\
                # .filter(Protocol.id == protocol)\
                .filter(Protocol.created_by == creator)
        )

    # Add a basic non-deleted items query if no filters were specified.
    if len(protocols_queries) == 0:
        protocols_queries.append(all_protocols(db, archived))

    # Only return the intersection of all queries.
    protocols_query = reduce(lambda a, b: a.intersect(b), protocols_queries)

    return paginatify(
        items_label='protocols',
        items=[
            protocol
            for protocol
            in protocols_query.distinct().order_by(Protocol.created_on.desc())
            if check_access(user=current_user.username, path=f"/protocol/{str(protocol.id)}", method="GET") and protocol and protocol.current
        ],
        item_to_dict=lambda protocol: item_to_dict(fix_plate_markers_protocol(db, protocol)),
        page=page,
        per_page=per_page,
    )

def crud_get_protocol(
    item_to_dict,

    db: Session,
    current_user: Auth0ClaimsPatched,

    protocol_id: int,
    version_id: Optional[int] = None,
) -> dict:
    if not check_access(user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    if version_id:
        protocol_version = ProtocolVersion.query\
            .filter(ProtocolVersion.id == version_id)\
            .filter(Protocol.id == protocol_id)\
            .first()
        if (not protocol_version) or protocol_version.protocol.is_deleted:
            raise HTTPException(status_code=404, detail='Protocol Not Found')
        return item_to_dict(protocol_version.protocol)

    protocol = db.query(Protocol).get(protocol_id)
    if (not protocol) or protocol.is_deleted:
        raise HTTPException(status_code=404, detail='Protocol Not Found')
    return item_to_dict(fix_plate_markers_protocol(db, protocol))
