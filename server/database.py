"""Database models and utilities."""

import copy
import pprint
from server import db


# Helpers ---------------------------------------------------------------------

def row_to_dict(row):
    """Convert a sqlalchemy row object into a plain python dictionary.

    Args:
        row (BaseModel): The db row object
    """
    d = {}
    for column in row.__table__.columns:
        attribute = getattr(row, column.name)
        if attribute is not None:
            d[column.name] = attribute

    return d

def json_row_to_dict(row):
    """Convert a sqlalchemy row object into a plain python dictionary.

    Assumes that row object contains the following columns:
    - id (int(64))
    - version (int(64))
    - data (JSON) Contains the rest of the fields as a single JSON column in postgres

    Args:
        row (BaseModel): The db row object
    """
    d = copy.deepcopy(row.data) if row.data else {}
    if row.id:
        d['id'] = row.id

    return d

def versioned_row_to_dict(row, row_version):
    """Convert a sqlalchemy row object into a plain python dictionary.

    Assumes that row object contains the following columns:
    - id (int)
    - created_on (datetime)
    - created_by (string(64))

    Assumes that row_version object contains the following columns:
    - id (int)
    - data (JSON) Contains the rest of the fields as a single JSON column in postgres
    - updated_on (datetime)
    - updated_by (string(64))

    Args:
        row (BaseModel): The db row object
    """
    d = copy.deepcopy(row_version.data) if row_version.data else {}
    if row.id:
        d['id'] = row.id
    if row.created_on:
        d['created_on'] = row.created_on
    if row.created_by:
        d['created_by'] = row.created_by
    if row_version.id:
        d['version_id'] = row_version.id
    if row_version.updated_on:
        d['updated_on'] = row_version.updated_on
    if row_version.updated_by:
        d['updated_by'] = row_version.updated_by

    return d

def strip_metadata(model):
    """Remove fields that are managed by the server.

    Args:
        model (dict): The dictionary to modify.
    """
    d = copy.deepcopy(model) if model else {}
    d.pop('id', None)
    d.pop('version_id', None)
    d.pop('created_on', None)
    d.pop('created_by', None)
    d.pop('updated_on', None)
    d.pop('updated_by', None)
    return d


# Tables ----------------------------------------------------------------------

class BaseModel(db.Model):
    __abstract__ = True
    def __repr__(self):
        return pprint.pformat(self.__dict__)

    is_deleted = db.Column(db.Boolean, default=False)
    created_on = db.Column(db.DateTime, server_default=db.func.now())
    created_by = db.Column(db.String(64))

class BaseVersionModel(db.Model):
    __abstract__ = True

    updated_on = db.Column(db.DateTime, server_default=db.func.now(), server_onupdate=db.func.now())
    updated_by = db.Column(db.String(64))

class UserVersion(BaseVersionModel):
    __tablename__ = 'user_version'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(64), db.ForeignKey('user.id'))
    data = db.Column(db.JSON())

    user = db.relationship('User', primaryjoin='UserVersion.user_id==User.id')

class User(BaseModel):
    __tablename__ = 'user'

    id = db.Column(db.String(64), primary_key=True)
    version_id = db.Column(db.Integer, db.ForeignKey('user_version.id', use_alter=True))

    current = db.relationship(UserVersion, primaryjoin='User.version_id==UserVersion.id', post_update=True)

class ProtocolVersion(BaseVersionModel):
    __tablename__ = 'protocol_version'

    id = db.Column(db.Integer, primary_key=True)
    protocol_id = db.Column(db.Integer, db.ForeignKey('protocol.id'))
    data = db.Column(db.JSON())

    protocol = db.relationship('Protocol', primaryjoin='ProtocolVersion.protocol_id==Protocol.id')

class Protocol(BaseModel):
    __tablename__ = 'protocol'

    id = db.Column(db.Integer, primary_key=True)
    version_id = db.Column(db.Integer, db.ForeignKey('protocol_version.id', use_alter=True))

    current = db.relationship(ProtocolVersion, primaryjoin='Protocol.version_id==ProtocolVersion.id', post_update=True)

class RunVersion(BaseVersionModel):
    __tablename__ = 'run_version'

    id = db.Column(db.Integer, primary_key=True)
    run_id = db.Column(db.Integer, db.ForeignKey('run.id'))
    data = db.Column(db.JSON())

    run = db.relationship('Run', primaryjoin='RunVersion.run_id==Run.id')

class Run(BaseModel):
    __tablename__ = 'run'

    id = db.Column(db.Integer, primary_key=True)
    version_id = db.Column(db.Integer, db.ForeignKey('run_version.id', use_alter=True))
    protocol_version_id = db.Column(db.Integer, db.ForeignKey('protocol_version.id', use_alter=True))

    current = db.relationship(RunVersion, primaryjoin='Run.version_id==RunVersion.id', post_update=True)
    protocol_version = db.relationship(ProtocolVersion, primaryjoin='Run.protocol_version_id==ProtocolVersion.id')
