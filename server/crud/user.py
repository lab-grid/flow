import urllib.parse

from sqlalchemy.orm import Session, Query
from typing import Optional, List
from fastapi import HTTPException

from authorization import check_access
from server import Auth0ClaimsPatched
from database import (
    User,
    UserVersion,
)
from api.utils import paginatify


def all_users(db: Session, include_archived=False) -> Query:
    query = db.query(User)
    if not include_archived:
        query = query.filter(User.is_deleted != True)
    return query

def crud_get_users(
    item_to_dict,

    db: Session,
    current_user: Auth0ClaimsPatched,

    archived: Optional[bool] = None,
    page: Optional[int] = None,
    per_page: Optional[int] = None,
) -> List[dict]:
    return paginatify(
        items_label='users',
        items=[
            user
            for user
            in all_users(db, archived).order_by(User.created_on.desc())
            if check_access(user=current_user.username, path=f"/user/{str(user.id)}", method="GET") and user and user.current
        ],
        item_to_dict=item_to_dict,
        page=page,
        per_page=per_page,
    )

def crud_get_user(
    item_to_dict,

    db: Session,
    current_user: Auth0ClaimsPatched,

    user_id: int,
    version_id: Optional[int] = None,
) -> dict:
    user_id = urllib.parse.unquote(user_id)
    if user_id != current_user.username and not check_access(user=current_user.username, path=f"/user/{str(user_id)}", method="GET"):
        raise HTTPException(status_code=403, detail='Insufficient Permissions')

    if version_id:
        user_version = db.query(UserVersion)\
            .filter(UserVersion.id == version_id)\
            .filter(User.id == user_id)\
            .first()
        if (not user_version) or user_version.user.is_deleted:
            raise HTTPException(status_code=404, detail='User Not Found')
        return item_to_dict(user_version.user)
    
    user = db.query(User).get(user_id)
    if (not user) or user.is_deleted:
        raise HTTPException(status_code=404, detail='User Not Found')

    return item_to_dict(user)
