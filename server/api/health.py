from flask_restx import Resource, fields, Namespace

from server import db


api = Namespace('server-health', description="Service health checks.", path='/')


health_output = api.model('HealthOutput', {
    'server': fields.Boolean(),
    'database': fields.Boolean(),
    'database_error': fields.String()
})


@api.route('/health')
class HealthResource(Resource):
    @api.doc(model=health_output)
    def get(self):
        status = {
            'server': True,
            'database': True
        }

        try:
            db.session.execute('SELECT 1')
        except Exception as err:
            status['database'] = False
            status['database_error'] = str(err)
            return status, 500
        return status
