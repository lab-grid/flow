import logging

from contextlib import contextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cloudauth.auth0 import Auth0, Auth0CurrentUser
from fastapi_utils.timing import add_timing_middleware

from pydantic import BaseModel, Field

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from easy_profile import StreamReporter
from easy_profile_asgi import EasyProfileMiddleware

from settings import settings


# Logging ---------------------------------------------------------------------

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Database --------------------------------------------------------------------

engine = create_engine(settings.sqlalchemy_database_uri)
# This shouldn't need to be a scoped_session.
# See: https://github.com/tiangolo/full-stack-fastapi-postgresql/issues/56
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def SessionTransaction():
    """Provide a transactional scope around a series of operations."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except:
        db.rollback()
        raise
    finally:
        db.close()

@contextmanager
def Session():
    """Provide a transactional scope around a series of operations."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# FastAPI Setup ---------------------------------------------------------------

app = FastAPI(
    title='Flow by LabGrid API',
    version='0.1.0',
    openapi_tags=[
        {
            'name': 'groups',
            'description': 'Operations on user groups.',
        },
        {
            'name': 'users',
            'description': 'Operations on users.',
        },
        {
            'name': 'system',
            'description': 'System operations.',
        },
        {
            'name': 'protocols',
            'description': 'Operations on protocols.',
        },
        {
            'name': 'runs',
            'description': 'Operations on runs.',
        },
        {
            'name': 'samples',
            'description': 'Operations on samples.'
        },
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    EasyProfileMiddleware,
    reporter=StreamReporter(display_duplicates=100)
)

add_timing_middleware(app, record=logger.info)


# Authentication --------------------------------------------------------------

auth = Auth0(domain=settings.auth0_domain)

class Auth0ClaimsPatched(BaseModel):
    username: str = Field(alias="sub")

class Auth0CurrentUserPatched(Auth0CurrentUser):
    """
    Verify `ID token` and extract user information
    """

    def __init__(self, domain: str, *args, **kwargs):
        self.user_info = Auth0ClaimsPatched
        super().__init__(domain, *args, **kwargs)

get_current_user = Auth0CurrentUserPatched(domain=settings.auth0_domain)
