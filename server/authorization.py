"""Utilities for API authorization."""

import json
import casbin
import casbin_sqlalchemy_adapter

from functools import wraps
from six.moves.urllib.request import urlopen
from jose import jwt

from flask import request, _request_ctx_stack

from server import app, api


# CASBIN Setup ----------------------------------------------------------------

casbin_adapter = casbin_sqlalchemy_adapter.Adapter(app.config['CASBIN_SQLALCHEMY_DATABASE_URI'])
casbin_enforcer = casbin.Enforcer(app.config['CASBIN_MODEL'], casbin_adapter)


# Auth Errors -----------------------------------------------------------------

class AuthError(Exception):
    """Represents a failure during authentication"""
    def __init__(self, error, status_code=401):
        super(AuthError, self).__init__(error)
        self.error = error
        self.status_code = status_code

@api.errorhandler(AuthError)
def handle_auth_error(ex):
    """Flask error handler"""
    return ex.error, ex.status_code


# Auth Helpers ----------------------------------------------------------------

def get_token_auth_header():
    """Obtains the Access Token from the Authorization Header"""
    auth = request.headers.get("Authorization", None)
    if not auth:
        raise AuthError({
            "code": "authorization_header_missing",
            "description": "Authorization header is expected"
        }, 401)

    parts = auth.split()

    if parts[0].lower() != "bearer":
        raise AuthError({
            "code": "invalid_header",
            "description": "Authorization header must start with Bearer"
        }, 401)
    if len(parts) == 1:
        raise AuthError({
            "code": "invalid_header",
            "description": "Token not found"
        }, 401)
    if len(parts) > 2:
        raise AuthError({
            "code": "invalid_header",
            "description": "Authorization header must be Bearer token"
        }, 401)

    token = parts[1]
    return token

def decode_jwt():
    token = get_token_auth_header()
    jsonurl = urlopen("https://"+app.config['AUTH0_DOMAIN']+"/.well-known/jwks.json")
    jwks = json.loads(jsonurl.read())
    unverified_header = jwt.get_unverified_header(token)
    rsa_key = {}
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"]
            }
    if rsa_key:
        try:
            return jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=app.config['AUTH0_API_AUDIENCE'],
                issuer="https://"+app.config['AUTH0_DOMAIN']+"/"
            )
        except jwt.ExpiredSignatureError:
            raise AuthError({
                "code": "token_expired",
                "description": "token is expired"
            }, 401)
        except jwt.JWTClaimsError:
            raise AuthError({
                "code": "invalid_claims",
                "description": "incorrect claims, please check the audience and issuer"
            }, 401)
        except Exception:
            raise AuthError({
                "code": "invalid_header",
                "description": "Unable to parse authentication token."
            }, 401)

def has_scope(required_scope):
    if app.config['AUTH_PROVIDER'] == 'auth0':
        token = get_token_auth_header()
        unverified_claims = jwt.get_unverified_claims(token)
        if unverified_claims.get("scope"):
            token_scopes = unverified_claims["scope"].split()
            for token_scope in token_scopes:
                if token_scope == required_scope:
                    return True
        return False
    else:
        return True

def check_access(user=None, path=None, method=None):
    sub = request.current_user["sub"] if user is None else user
    obj = request.path if path is None else path
    act = request.method if method is None else method
    return casbin_enforcer.enforce(sub, obj, act)

def add_policy(user=None, path=None, method=None):
    sub = request.current_user["sub"] if user is None else user
    obj = request.path if path is None else path
    act = request.method if method is None else method
    return casbin_enforcer.add_permission_for_user(sub, obj, act)

def delete_policy(user='', path='', method=''):
    casbin_enforcer.remove_filtered_policy(0, user, path, method)

def get_policies(user='', path='', method=''):
    rules = casbin_enforcer.get_filtered_policy(0, user, path, method)
    # TODO: Make sure the /protocol/* cases are handled properly.
    return [{'user': rule[0], 'path': rule[1], 'method': rule[2]} for rule in rules]


# Decorators ------------------------------------------------------------------

def requires_auth(f):
    """Determines if the Access Token is valid"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if app.config['AUTH_PROVIDER'] == 'none':
            request.current_user = {'sub': '42'}
            return f(*args, **kwargs)
        elif app.config['AUTH_PROVIDER'] == 'auth0':
            payload = decode_jwt()
            if payload:
                request.current_user = payload
                return f(*args, **kwargs)
            raise AuthError({
                "code": "invalid_header",
                "description": "Unable to find appropriate key"
            }, 401)
        return f(*args, **kwargs)
    return decorated

def requires_scope(required_scope):
    """Determines if the required scope is present in the Access Token
    Args:
        required_scope (str): The scope required to access the resource
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if has_scope(required_scope):
                return f(*args, **kwargs)
            raise AuthError({
                "code": "missing_scope",
                "description": "Missing scope: " + str(required_scope)
            }, 401)
        return decorated
    return decorator

def requires_access(path=None, method=None):
    """Determines if the user is allowed to perform an action using CASBIN
    Args:
        path (str|None): CASBIN request object to check access to. Defaults to request path.
        method (str|None): CASBIN request action to check access to. Defaults to request method.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if request.current_user is None:
                raise AuthError({
                    "code": "invalid_header",
                    "description": "Unable to find auth token"
                }, 401)
            if check_access(
                path=request.path if path is None else path,
                method=request.method if method is None else method
            ):
                return f(*args, **kwargs)
            raise AuthError({
                "code": "unauthorized",
                "description": "User is not authorized to perform this action"
            }, 403)
        return decorated
    return decorator
