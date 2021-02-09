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


def add_role(d):
    d['role'] = get_roles(d['id'])
    return d


@app.get('/user', tags=['users'], response_model=UsersModel, response_model_exclude_none=True)
async def get_users(page: Optional[int] = None, per_page: Optional[int] = None, db: Session = Depends(get_db), current_user: Auth0ClaimsPatched = Depends(get_current_user)):
    return paginatify(
        items_label='users',
        items=[
            user
            for user
            in db.query(User).filter(User.is_deleted != True).all()
            if check_access(user=current_user.username, path=f"/user/{user.id}", method="GET")
        ],
        item_to_dict=lambda user: add_role(versioned_row_to_dict(user, user.current)),
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
    user_id = urllib.parse.unquote(user_id)
    if user_id != current_user.username and not check_access(user=current_user.username, path=f"/user/{user_id}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    if version_id:
        user_version = UserVersion.query\
            .filter(UserVersion.id == version_id)\
            .filter(User.id == user_id)\
            .first()
        if (not user_version) or user_version.user.is_deleted:
            raise HTTPException(status_code=404, detail='User Not Found')
        return add_role(versioned_row_to_dict(user_version.user, user_version))
    
    user = db.query(User).get(user_id)
    if (not user) or user.is_deleted:
        raise HTTPException(status_code=404, detail='User Not Found')
    return add_role(versioned_row_to_dict(user, user.current))

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
