"""Utilities for API authorization."""

from typing import Optional
import casbin
import casbin_sqlalchemy_adapter

from settings import settings


# CASBIN Dependency -----------------------------------------------------------

def init_enforcer():
    casbin_adapter = casbin_sqlalchemy_adapter.Adapter(settings.casbin_database_uri)
    return casbin.Enforcer(settings.casbin_model, casbin_adapter)

def get_enforcer():
    casbin_enforcer = init_enforcer()
    try:
        yield casbin_enforcer
    finally:
        casbin_enforcer.close()


# CASBIN Helpers --------------------------------------------------------------

# TODO: Support multi-tenant mode (teams)
def check_access(enforcer: casbin.Enforcer, user, path, method):
    if enforcer is None:
        enforcer = init_enforcer()
    return enforcer.enforce(user, path, method)

def add_policy(enforcer: casbin.Enforcer, user, path, method):
    if enforcer is None:
        enforcer = init_enforcer()
    return enforcer.add_permission_for_user(user, path, method)

def delete_policy(enforcer: casbin.Enforcer, user='', path='', method=''):
    if enforcer is None:
        enforcer = init_enforcer()
    return enforcer.remove_filtered_policy(0, user, path, method)

def get_policies(enforcer: casbin.Enforcer, user='', path='', method=''):
    if enforcer is None:
        enforcer = init_enforcer()
    rules = enforcer.get_filtered_policy(0, user, path, method)
    # TODO: Make sure the /protocol/* cases are handled properly.
    return [{'user': rule[0], 'path': rule[1], 'method': rule[2]} for rule in rules]

def get_roles(enforcer: casbin.Enforcer, user):
    if enforcer is None:
        enforcer = init_enforcer()
    return enforcer.get_roles_for_user(user)

def get_all_roles(enforcer: casbin.Enforcer):
    if enforcer is None:
        enforcer = init_enforcer()
    return enforcer.get_all_roles()
