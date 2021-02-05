from typing import Union
from fastapi import Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from authorization import get_all_roles
from server import app, get_db
from settings import settings
from models import HealthCheck


@app.get('/health', tags=['system'], response_model=HealthCheck, response_model_exclude_none=True)
async def health_check(db: Session = Depends(get_db)):
    status = {
        'version': settings.server_version,
        'server': True,
        'database': True
    }

    try:
        db.execute('SELECT 1')
    except Exception as err:
        status['database'] = False
        status['database_error'] = str(err)
        return JSONResponse(
            status_code=500,
            content=status,
        )
    # return HealthCheck(**status)
    return status
