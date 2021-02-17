import sys
import urllib.parse

from functools import wraps
from typing import Optional

from fastapi import Depends, HTTPException
from server import Auth0ClaimsPatched
from sqlalchemy.orm import Session

from server import app, get_db, get_current_user
from settings import settings
from authorization import check_access, add_policy, get_policies, get_roles
from database import versioned_row_to_dict, strip_metadata, User, UserVersion
from models import UserModel, UsersModel

from api.utils import add_owner, add_updator, paginatify

from crud.user import crud_get_users, crud_get_user


def add_role(d):
    d['role'] = get_roles(d['id'])
    return d


@app.get('/user', tags=['users'], response_model=UsersModel, response_model_exclude_none=True)
async def get_users(
    page: Optional[int] = None,
    per_page: Optional[int] = None,

    db: Session = Depends(get_db),
    current_user: Auth0ClaimsPatched = Depends(get_current_user),
):
    return crud_get_users(
        item_to_dict=lambda user: add_role(versioned_row_to_dict(user, user.current)),

        db=db,
        current_user=current_user,

        archived=False,
        page=page,
        per_page=per_page,
    )

@app.post('/user', tags=['users'], response_model=UserModel, response_model_exclude_none=True)
async def create_user(user: UserModel, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    user_dict = user.dict()

    # Drop the roles field if it was provided.
    user_dict.pop('roles', None)
    new_user = User(id=current_user.username if current_user.username else 42)
    new_user_version = UserVersion(data=strip_metadata(user_dict), server_version=settings.server_version)
    new_user_version.user = new_user
    new_user.current = new_user_version
    add_owner(new_user, current_user.username)
    db.add_all([new_user, new_user_version])
    db.commit()
    add_policy(user=current_user.username, path=f"/user/{str(new_user.id)}", method="GET")
    add_policy(user=current_user.username, path=f"/user/{str(new_user.id)}", method="PUT")
    return add_role(versioned_row_to_dict(new_user, new_user_version))

@app.get('/user/{user_id}', tags=['users'], response_model=UserModel, response_model_exclude_none=True)
async def get_user(user_id: str, version_id: Optional[int] = None, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    return crud_get_user(
        item_to_dict=lambda user: add_role(versioned_row_to_dict(user, user.current)),

        db=db,
        current_user=current_user,
        
        user_id=user_id,
        version_id=version_id,
    )

@app.put('/user/{user_id}', tags=['users'], response_model=UserModel, response_model_exclude_none=True)
async def update_user(user_id: str, user: UserModel, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    user_id = urllib.parse.unquote(user_id)

    user_dict = user.dict()
    # Drop the roles field if it was provided.
    user_dict.pop('roles', None)
    new_user = db.query(User).get(user_id)
    if not new_user or new_user.is_deleted:
        raise HTTPException(status_code=404, detail='User Not Found')
    new_user_version = UserVersion(data=strip_metadata(user_dict), server_version=settings.server_version)
    new_user_version.user = new_user
    add_updator(new_user_version, current_user.username)
    new_user.current = new_user_version
    db.add(new_user_version)
    db.commit()
    return add_role(versioned_row_to_dict(new_user, new_user.current))
