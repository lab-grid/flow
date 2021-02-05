from typing import List

from authorization import get_all_roles
from server import app
from models import Group


@app.get('/group', tags=['groups'], response_model=List[Group], response_model_exclude_none=True)
async def get_groups():
    return [
        Group(id=role)
        for role
        in get_all_roles()
    ]
