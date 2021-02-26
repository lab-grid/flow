from starlette.graphql import GraphQLApp
from fastapi import Request, Response, HTTPException
from fastapi.security.http import HTTPBearer
from server import app, get_current_user
from api_graphql.schema import schema


@app.middleware("http")
async def add_current_user(request: Request, call_next):
    # Only do the following if this is the graphql app.
    if request.url.path.startswith("/graphql") and request.method != "OPTIONS":
        try:
            request.state.user = await get_current_user(await HTTPBearer()(request))
        except HTTPException as ex:
            return Response(ex.detail, media_type="text/plain", status_code=ex.status_code)

    return await call_next(request)

app.add_route("/graphql", GraphQLApp(schema=schema))
