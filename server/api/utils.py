from flask import request
from flask_restx import fields

import copy
import math
from deepdiff import DeepHash

from server import api


success_output = api.model('SuccessOutput', {
    'success': fields.String()
})


# -----------------------------------------------------------------------------
# Status Helpers --------------------------------------------------------------
# -----------------------------------------------------------------------------

WITNESS_FIELD = 'witness'
SIGNATURE_FIELD = 'signature'
STATUS_FIELD = 'status'
STATUS_TODO = 'todo'
STATUS_SIGNED = 'signed'
STATUS_WITNESSED = 'witnessed'


def status_order(status):
    if status == STATUS_TODO:
        return 0
    if status == STATUS_SIGNED:
        return 1
    if status == STATUS_WITNESSED:
        return 2

    return -1


def status_lt(status_a, status_b):
    return status_order(status_a) < status_order(status_b)


def changed_fields(orig_dict, new_dict, skip=None):
    if not skip:
        skip = []
    orig_copy = copy.deepcopy(orig_dict) if orig_dict else {}
    new_copy = copy.deepcopy(new_dict) if new_dict else {}
    # Ignore fields that the new_dict is missing.
    # for field in orig_dict:
    #     if not field in new_dict:
    #         orig_copy.pop(field, None)
    for field in skip:
        orig_copy.pop(field, None)
        new_copy.pop(field, None)

    orig_hash = DeepHash(orig_copy)[orig_copy]
    new_hash = DeepHash(new_copy)[new_copy]
    
    return orig_hash != new_hash


def change_allowed(orig_dict, new_dict):
    is_signed = orig_dict.get(STATUS_FIELD, None) == STATUS_SIGNED
    is_witnessed = orig_dict.get(STATUS_FIELD, None) == STATUS_WITNESSED

    is_signing = new_dict.get(STATUS_FIELD, None) == STATUS_SIGNED and status_lt(orig_dict.get(STATUS_FIELD, None), STATUS_SIGNED)
    is_witnessing = new_dict.get(STATUS_FIELD, None) == STATUS_WITNESSED and status_lt(orig_dict.get(STATUS_FIELD, None), STATUS_WITNESSED)

    is_unsigning = status_lt(new_dict.get(STATUS_FIELD, None), STATUS_SIGNED) and orig_dict.get(STATUS_FIELD, None) == STATUS_SIGNED
    is_unwitnessing = status_lt(new_dict.get(STATUS_FIELD, None), STATUS_WITNESSED) and orig_dict.get(STATUS_FIELD, None) == STATUS_WITNESSED

    changed_non_status = changed_fields(orig_dict, new_dict, skip=[STATUS_FIELD])
    changed_non_status_witness = changed_fields(orig_dict, new_dict, skip=[STATUS_FIELD, WITNESS_FIELD])

    if (is_signed or is_witnessed) and not (is_unsigning or is_unwitnessing) and changed_non_status:
        return False
    if is_signed and is_witnessing and changed_non_status_witness:
        return False
    if is_witnessed and is_unwitnessing and changed_non_status_witness:
        return False
    return True


# -----------------------------------------------------------------------------
# Common Parameters -----------------------------------------------------------
# -----------------------------------------------------------------------------


run_id_param = {
    'description': 'Numeric ID for a run',
    'in': 'path',
    'type': 'int'
}
protocol_id_param = {
    'description': 'Numeric ID for a protocol',
    'in': 'path',
    'type': 'int'
}
user_id_param = {
    'description': 'String identifier for a user account',
    'in': 'path',
    'type': 'string'
}
sample_id_param = {
    'description': 'String ID for a sample',
    'in': 'path',
    'type': 'string'
}
attachment_id_param = {
    'description': 'String ID for a file attachment',
    'in': 'path',
    'type': 'string'
}
version_id_param = {
    'description': 'Specify this query parameter to retrieve a specific record version',
    'in': 'query',
    'type': 'int'
}
purge_param = {
    'description': 'Purge after deleting',
    'in': 'query',
    'type': 'boolean'
}
user_id_param = {
    'description': 'String identifier for a user account',
    'in': 'path',
    'type': 'string'
}
protocol_param = {
    'description': 'Numeric ID for a protocol to filter by',
    'in': 'query',
    'type': 'int'
}
run_param = {
    'description': 'Numeric ID for a run to filter by',
    'in': 'query',
    'type': 'int'
}
plate_param = {
    'description': 'Identifier for a plate to filter by',
    'in': 'query',
    'type': 'string'
}
sample_param = {
    'description': 'Identifier for a sample to filter by',
    'in': 'query',
    'type': 'string'
}
reagent_param = {
    'description': 'Identifier for a reagent to filter by',
    'in': 'query',
    'type': 'string'
}
creator_param = {
    'description': 'ID of a creating user to filter by',
    'in': 'query',
    'type': 'string'
}
archived_param = {
    'description': 'Determines if archived records are returned',
    'in': 'query',
    'type': 'boolean'
}
method_param = {
    'description': 'Action identifier (GET|POST|PUT|DELETE)',
    'in': 'path',
    'type': 'string'
}
page_param = {
    'description': 'Page number if using pagination',
    'in': 'query',
    'type': 'int'
}
per_page_param = {
    'description': 'Maximum number of records returned per page if using pagination',
    'in': 'query',
    'type': 'int'
}
method_filter_param = {
    'description': 'Action identifier (GET|POST|PUT|DELETE)',
    'in': 'query',
    'type': 'string'
}
user_id_filter_param = {
    'description': 'String identifier for a user account',
    'in': 'query',
    'type': 'string'
}


# -----------------------------------------------------------------------------
# Pagination ------------------------------------------------------------------
# -----------------------------------------------------------------------------

def paginatify(items_label, items, item_to_dict):
    response = {}
    if request.args.get('page') is not None or request.args.get('per_page') is not None:
        page = int(request.args.get('page')) if request.args.get('page') else 1
        per_page = int(request.args.get('per_page')) if request.args.get('per_page') else 20
        starting_index = (page - 1) * per_page
        ending_index = page * per_page

        response[items_label] = [item_to_dict(item) for item in items[starting_index:ending_index]]
        response['page'] = page
        response['pageCount'] = math.ceil(float(len(items)) / per_page)
    else:
        response[items_label] = [item_to_dict(item) for item in items]

    return response


# -----------------------------------------------------------------------------
# Miscellaneous ---------------------------------------------------------------
# -----------------------------------------------------------------------------

def add_owner(model, user_id=None):
    if user_id is None:
        user_id = request.current_user["sub"]
    model.created_by = user_id

def add_updator(model, user_id=None):
    if user_id is None:
        user_id = request.current_user["sub"]
    model.updated_by = user_id
