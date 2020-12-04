import os

from flask import Flask
from flask.json import JSONEncoder
from flask_cors import CORS
from flask_migrate import Migrate
from flask_restx import Api
from flask_sqlalchemy import SQLAlchemy
# https://github.com/noirbizarre/flask-restplus/issues/565#issuecomment-562610603
from werkzeug.middleware.proxy_fix import ProxyFix


app = Flask(__name__, static_folder='static', static_url_path='')
app.wsgi_app = ProxyFix(app.wsgi_app)


# Configuration ---------------------------------------------------------------

app.config['SERVER_NAME'] = os.environ.get('SERVER_NAME', app.config.get('SERVER_NAME'))
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = os.environ.get('SQLALCHEMY_TRACK_MODIFICATIONS', 'False') == 'True'
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///labflow.db')
app.config['SQLALCHEMY_ECHO'] = os.environ.get('SQLALCHEMY_ECHO', 'False') == 'True'
app.config['AUTH_PROVIDER'] = os.environ.get('AUTH_PROVIDER', 'auth0')
app.config['AUTH0_DOMAIN'] = os.environ.get('AUTH0_DOMAIN', '')
app.config['AUTH0_CLIENT_ID'] = os.environ.get('AUTH0_CLIENT_ID', 'Msk8I4Ad2ujE76MwOatsmmvEEds5v50h')
app.config['AUTH0_API_AUDIENCE'] = os.environ.get('AUTH0_API_AUDIENCE', '')
app.config['AUTH0_AUTHORIZATION_URL'] = os.environ.get('AUTH0_AUTHORIZATION_URL', '')
app.config['AUTH0_TOKEN_URL'] = os.environ.get('AUTH0_TOKEN_URL', '')
app.config['CASBIN_MODEL'] = os.environ.get('CASBIN_MODEL', 'casbinmodel.conf')
app.config['CASBIN_SQLALCHEMY_DATABASE_URI'] = os.environ.get('CASBIN_SQLALCHEMY_DATABASE_URI', app.config['SQLALCHEMY_DATABASE_URI'])
app.config['RESTX_JSON'] = {'cls': JSONEncoder}  # Add support for serializing datetime/date
app.config['SERVER_VERSION'] = os.environ.get('SERVER_VERSION', 'local')


# API Documentation -----------------------------------------------------------

authorizations = {
    'token': {
        'type': 'oauth2',
        'flow': 'accessCode',
        # 'flow': 'authorizationCode',
        'audience': app.config['AUTH0_API_AUDIENCE'],
        'domain': app.config['AUTH0_DOMAIN'],
        'clientId': app.config['AUTH0_CLIENT_ID'],
        'authorizationUrl': app.config['AUTH0_AUTHORIZATION_URL'],
        'tokenUrl': app.config['AUTH0_TOKEN_URL'],
        'scopes': {
            'read:runs': 'Read user runs',
            'read:protocols': 'Read user protocols',
            'write:runs': 'Write to user runs',
            'write:protocols': 'Write to user protocols',
        }
    }
}
api = Api(
    app,
    title='Flow by LabGrid API',
    version='0.1.0',
    authorizations=authorizations,
)
CORS(app)


# Database --------------------------------------------------------------------

db = SQLAlchemy(app)
migrate = Migrate(app, db)
