from typing import List

import casbin
from fastapi import Depends

from authorization import get_all_roles, get_enforcer
from server import app
from models import Group


@app.get('/group', tags=['groups'], response_model=List[Group], response_model_exclude_none=True)
async def get_groups(enforcer: casbin.Enforcer = Depends(get_enforcer)):
    return [
        Group(id=role)
        for role
        in get_all_roles(enforcer)
    ]
