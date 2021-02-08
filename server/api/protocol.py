from functools import reduce, wraps
from typing import List, Optional

from fastapi import Depends, HTTPException
from server import Auth0ClaimsPatched
from sqlalchemy.orm import Session

import jsonpatch

from server import app, get_db, get_current_user
from settings import settings
from authorization import check_access, add_policy, delete_policy, get_policies
from database import filter_by_plate_label, filter_by_reagent_label, filter_by_sample_label, versioned_row_to_dict, json_row_to_dict, strip_metadata, Protocol, ProtocolVersion, Run, RunVersion
from models import Policy, ProtocolModel, ProtocolsModel, SuccessResponse, success
from pydantic_jsonpatch.jsonpatch import JSONPatch

from api.utils import change_allowed, add_owner, add_updator, paginatify


def all_protocols(include_archived=False):
    query = Protocol.query
    if not include_archived:
        query = query.filter(Protocol.is_deleted != True)
    return query


@app.get('/protocol', tags=['protocols'], response_model=ProtocolsModel, response_model_exclude_none=True)
async def get_protocols(
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
    protocols_queries = []
    if run:
        protocols_queries.append(
            all_protocols(archived)\
                .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
                .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
                .filter(Run.id == run)
        )
    if plate:
        run_version_query = all_protocols(archived)\
            .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
            .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
            .join(RunVersion, RunVersion.id == Run.version_id)
        protocols_subquery = filter_by_plate_label(run_version_query, plate)
        protocols_queries.append(protocols_subquery)
    if reagent:
        run_version_query = all_protocols(archived)\
            .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
            .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
            .join(RunVersion, RunVersion.id == Run.version_id)
        protocols_subquery = filter_by_reagent_label(run_version_query, reagent)
        protocols_queries.append(protocols_subquery)
    if sample:
        run_version_query = all_protocols(archived)\
            .join(ProtocolVersion, ProtocolVersion.protocol_id == Protocol.id)\
            .join(Run, Run.protocol_version_id == ProtocolVersion.id)\
            .join(RunVersion, RunVersion.id == Run.version_id)
        protocols_subquery = filter_by_sample_label(run_version_query, sample)
        protocols_queries.append(protocols_subquery)
    if creator:
        protocols_queries.append(
            all_protocols(archived)\
                # .filter(Protocol.id == protocol)\
                .filter(Protocol.created_by == creator)
        )

    # Add a basic non-deleted items query if no filters were specified.
    if len(protocols_queries) == 0:
        protocols_queries.append(all_protocols(archived))

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
        item_to_dict=lambda protocol: versioned_row_to_dict(protocol, protocol.current, include_large_fields=False),
        page=page,
        per_page=per_page,
    )

@app.post('/protocol', tags=['protocols'], response_model=ProtocolModel, response_model_exclude_none=True)
async def create_protocol(protocol: ProtocolModel, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    protocol_dict = protocol.dict()
    protocol = Protocol()
    protocol_version = ProtocolVersion(data=strip_metadata(protocol_dict), server_version=settings.server_version)
    protocol_version.protocol = protocol
    protocol.current = protocol_version
    add_owner(protocol, current_user.username)
    db.add_all([protocol, protocol_version])
    db.commit()
    add_policy(user=current_user.username, path=f"/protocol/{str(protocol.id)}", method="GET")
    add_policy(user=current_user.username, path=f"/protocol/{str(protocol.id)}", method="PUT")
    add_policy(user=current_user.username, path=f"/protocol/{str(protocol.id)}", method="DELETE")
    return versioned_row_to_dict(protocol, protocol_version)

@app.get('/protocol/{protocol_id}', tags=['protocols'], response_model=ProtocolModel, response_model_exclude_none=True)
async def get_protocol(protocol_id: int, version_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    if version_id:
        protocol_version = ProtocolVersion.query\
            .filter(ProtocolVersion.id == version_id)\
            .filter(Protocol.id == protocol_id)\
            .first()
        if (not protocol_version) or protocol_version.protocol.is_deleted:
            raise HTTPException(status_code=404, detail='Protocol Not Found')
        return versioned_row_to_dict(protocol_version.protocol, protocol_version)

    protocol = db.query(Protocol).get(protocol_id)
    if (not protocol) or protocol.is_deleted:
        raise HTTPException(status_code=404, detail='Protocol Not Found')
    return versioned_row_to_dict(protocol, protocol.current)

@app.put('/protocol/{protocol_id}', tags=['protocols'], response_model=ProtocolModel, response_model_exclude_none=True)
async def update_protocol(protocol_id: int, protocol: ProtocolModel, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    protocol_dict = protocol.dict()
    new_protocol = db.query(Protocol).get(protocol_id)
    if not new_protocol or new_protocol.is_deleted:
        raise HTTPException(status_code=404, detail='Protocol Not Found')
    if not change_allowed(versioned_row_to_dict(new_protocol, new_protocol.current), protocol_dict):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')
    new_protocol_version = ProtocolVersion(data=strip_metadata(protocol_dict), server_version=settings.server_version)
    new_protocol_version.protocol = new_protocol
    add_updator(new_protocol_version, current_user.username)
    new_protocol.current = new_protocol_version
    db.add(new_protocol_version)
    db.commit()
    return versioned_row_to_dict(new_protocol, new_protocol.current)

@app.patch('/protocol/{protocol_id}', tags=['protocols'], response_model=ProtocolModel, response_model_exclude_none=True)
async def patch_protocol(protocol_id: int, patch: list, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    new_protocol = db.query(Protocol).get(protocol_id)
    if not new_protocol or new_protocol.is_deleted:
        raise HTTPException(status_code=404, detail='Protocol Not Found')

    protocol_dict = versioned_row_to_dict(new_protocol, new_protocol.current)
    json_patch = jsonpatch.JsonPatch(patch)
    protocol_dict = json_patch.apply(protocol_dict)

    if not change_allowed(versioned_row_to_dict(new_protocol, new_protocol.current), protocol_dict):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    new_protocol_version = ProtocolVersion(data=strip_metadata(protocol_dict), server_version=settings.server_version)
    new_protocol_version.protocol = new_protocol
    add_updator(new_protocol_version, current_user.username)
    new_protocol.current = new_protocol_version
    db.add(new_protocol_version)
    db.commit()
    return versioned_row_to_dict(new_protocol, new_protocol.current)

@app.delete('/protocol/{protocol_id}', tags=['protocols'], response_model=SuccessResponse, response_model_exclude_none=True)
async def delete_protocol(protocol_id: int, purge: bool = False, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="DELETE"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    protocol = db.query(Protocol).get(protocol_id)
    if not protocol or protocol.is_deleted:
        raise HTTPException(status_code=404, detail='Protocol Not Found')
    if purge:
        db.delete(protocol)
    else:
        protocol.is_deleted = True
    db.commit()
    delete_policy(path=f"/protocol/{str(protocol.id)}")
    return success


# Permissions -----------------------------------------------------------------

@app.get('/protocol/{protocol_id}/permission', tags=['protocols'], response_model=List[Policy], response_model_exclude_none=True)
async def get_permissions(protocol_id: int, current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    return get_policies(path=f"/protocol/{protocol_id}")

@app.post('/protocol/{protocol_id}/permission/{method}/{user_id}', tags=['protocols'], response_model=Policy, response_model_exclude_none=True)
async def create_permission(protocol_id: int, method: str, user_id: str, current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    add_policy(user=user_id, path=f"/protocol/{protocol_id}", method=method)
    return success

@app.delete('/protocol/{protocol_id}/permission/{method}/{user_id}', tags=['protocols'], response_model=SuccessResponse, response_model_exclude_none=True)
async def delete_permission(protocol_id: int, method: str, user_id: str, current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    delete_policy(user=user_id, path=f"/protocol/{protocol_id}", method=method)
    return success
