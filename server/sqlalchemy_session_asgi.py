from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class SqlalchemySessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, session_factory):
        self.app = app
        self.session_factory = session_factory

    async def dispatch_func(self, request: Request, call_next):
        with self.session_factory() as db:
            request.state.session = db
            response = await call_next(request)
            request.state.session = None
            return response
