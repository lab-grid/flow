from flask_restx import Resource, fields, Namespace

from server import app, db


api = Namespace('server-health', description="Service health checks.", path='/')


health_output = api.model('HealthOutput', {
    'version': fields.String(),
    'server': fields.Boolean(),
    'database': fields.Boolean(),
    'database_error': fields.String()
})


@api.route('/health')
class HealthResource(Resource):
    @api.doc(model=health_output)
    def get(self):
        status = {
            'version': app.config['SERVER_VERSION'],
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
