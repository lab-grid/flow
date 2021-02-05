"""Utilities for API authorization."""

import json
import casbin
import casbin_sqlalchemy_adapter

from settings import settings


# CASBIN Setup ----------------------------------------------------------------

casbin_adapter = casbin_sqlalchemy_adapter.Adapter(settings.casbin_database_uri)
casbin_enforcer = casbin.Enforcer(settings.casbin_model, casbin_adapter)


# CASBIN Helpers --------------------------------------------------------------

# TODO: Support multi-tenant mode (teams)
def check_access(user, path, method):
    return casbin_enforcer.enforce(user, path, method)

def add_policy(user, path, method):
    return casbin_enforcer.add_permission_for_user(user, path, method)

def delete_policy(user='', path='', method=''):
    return casbin_enforcer.remove_filtered_policy(0, user, path, method)

def get_policies(user='', path='', method=''):
    rules = casbin_enforcer.get_filtered_policy(0, user, path, method)
    # TODO: Make sure the /protocol/* cases are handled properly.
    return [{'user': rule[0], 'path': rule[1], 'method': rule[2]} for rule in rules]

def get_roles(user):
    return casbin_enforcer.get_roles_for_user(user)

def get_all_roles():
    return casbin_enforcer.get_all_roles()
