from typing import List, Optional
import casbin

from fastapi import Depends, HTTPException
from server import Auth0ClaimsPatched
from sqlalchemy.orm import Session

import jsonpatch

from server import app, get_db, get_current_user
from settings import settings
from authorization import check_access, add_policy, delete_policy, get_enforcer, get_policies
from database import versioned_row_to_dict, strip_metadata, Protocol, ProtocolVersion
from models import Policy, ProtocolModel, ProtocolsModel, SuccessResponse, success

from api.utils import change_allowed, add_owner, add_updator
from crud.protocol import crud_get_protocols, crud_get_protocol


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
    enforcer: casbin.Enforcer = Depends(get_enforcer),
    db: Session = Depends(get_db),
    current_user: Auth0ClaimsPatched = Depends(get_current_user)
):
    return crud_get_protocols(
        item_to_dict=lambda protocol: versioned_row_to_dict(protocol, protocol.current, include_large_fields=False),

        enforcer=enforcer,
        db=db,
        current_user=current_user,

        run=run,
        plate=plate,
        reagent=reagent,
        sample=sample,
        creator=creator,
        archived=archived,
        page=page,
        per_page=per_page,
    )

@app.post('/protocol', tags=['protocols'], response_model=ProtocolModel, response_model_exclude_none=True)
async def create_protocol(protocol: ProtocolModel, enforcer: casbin.Enforcer = Depends(get_enforcer), db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    protocol_dict = protocol.dict()
    protocol = Protocol()
    protocol_version = ProtocolVersion(data=strip_metadata(protocol_dict), server_version=settings.server_version)
    protocol_version.protocol = protocol
    protocol.current = protocol_version
    add_owner(protocol, current_user.username)
    db.add_all([protocol, protocol_version])
    db.commit()
    add_policy(enforcer, user=current_user.username, path=f"/protocol/{str(protocol.id)}", method="GET")
    add_policy(enforcer, user=current_user.username, path=f"/protocol/{str(protocol.id)}", method="PUT")
    add_policy(enforcer, user=current_user.username, path=f"/protocol/{str(protocol.id)}", method="DELETE")
    return versioned_row_to_dict(protocol, protocol_version)

@app.get('/protocol/{protocol_id}', tags=['protocols'], response_model=ProtocolModel, response_model_exclude_none=True)
async def get_protocol(protocol_id: int, version_id: Optional[int] = None, enforcer: casbin.Enforcer = Depends(get_enforcer), db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    return crud_get_protocol(
        item_to_dict=lambda protocol: versioned_row_to_dict(protocol, protocol.current),

        enforcer=enforcer,
        db=db,
        current_user=current_user,

        protocol_id=protocol_id,
        version_id=version_id,
    )

@app.put('/protocol/{protocol_id}', tags=['protocols'], response_model=ProtocolModel, response_model_exclude_none=True)
async def update_protocol(protocol_id: int, protocol: ProtocolModel, enforcer: casbin.Enforcer = Depends(get_enforcer), db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(enforcer, user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="PUT"):
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
async def patch_protocol(protocol_id: int, patch: list, enforcer: casbin.Enforcer = Depends(get_enforcer), db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(enforcer, user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="PUT"):
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
async def delete_protocol(protocol_id: int, purge: bool = False, enforcer: casbin.Enforcer = Depends(get_enforcer), db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(enforcer, user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="DELETE"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    protocol = db.query(Protocol).get(protocol_id)
    if not protocol or protocol.is_deleted:
        raise HTTPException(status_code=404, detail='Protocol Not Found')
    if purge:
        db.delete(protocol)
    else:
        protocol.is_deleted = True
    db.commit()
    delete_policy(enforcer, path=f"/protocol/{str(protocol.id)}")
    return success


# Permissions -----------------------------------------------------------------

@app.get('/protocol/{protocol_id}/permission', tags=['protocols'], response_model=List[Policy], response_model_exclude_none=True)
async def get_permissions(protocol_id: int, enforcer: casbin.Enforcer = Depends(get_enforcer), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(enforcer, user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    return get_policies(enforcer, path=f"/protocol/{protocol_id}")

@app.post('/protocol/{protocol_id}/permission/{method}/{user_id}', tags=['protocols'], response_model=Policy, response_model_exclude_none=True)
async def create_permission(protocol_id: int, method: str, user_id: str, enforcer: casbin.Enforcer = Depends(get_enforcer), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(enforcer, user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    add_policy(enforcer, user=user_id, path=f"/protocol/{protocol_id}", method=method)
    return success

@app.delete('/protocol/{protocol_id}/permission/{method}/{user_id}', tags=['protocols'], response_model=SuccessResponse, response_model_exclude_none=True)
async def delete_permission(protocol_id: int, method: str, user_id: str, enforcer: casbin.Enforcer = Depends(get_enforcer), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    if not check_access(enforcer, user=current_user.username, path=f"/protocol/{str(protocol_id)}", method="PUT"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    delete_policy(enforcer, user=user_id, path=f"/protocol/{protocol_id}", method=method)
    return success
