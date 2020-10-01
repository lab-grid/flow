from flask_restplus import fields

from server import api


success_output = api.model('SuccessOutput', {
    'success': fields.String()
})
