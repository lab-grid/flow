from flask_restx import fields

import copy
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
