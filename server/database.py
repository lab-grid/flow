"""Database models and utilities."""

import pprint
from server import db


# Helpers ---------------------------------------------------------------------

def row2dict(row):
    """Converts a flask-sqlalchemy db row object into a plain python dictionary
    Args:
        row (BaseModel): The db row object
    """
    d = {}
    for column in row.__table__.columns:
        attribute = getattr(row, column.name)
        if attribute is not None:
            d[column.name] = attribute

    return d


# Tables ----------------------------------------------------------------------

class BaseModel(db.Model):
    __abstract__ = True
    def __repr__(self):
        return pprint.pformat(self.__dict__)

    created_on = db.Column(db.DateTime)
    created_by = db.Column(db.String(64))
    updated_on = db.Column(db.DateTime)
    updated_by = db.Column(db.String(64))

class Run(BaseModel):
    __tablename__ = 'run'

    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.JSON())

class Protocol(BaseModel):
    __tablename__ = 'protocol'

    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.JSON())


# Permissions -----------------------------------------------------------------

class RunPermission(BaseModel):
    __tablename__ = 'run_permission'

    run_id = db.Column(db.Integer, db.ForeignKey('run.id'), primary_key=True)
    user_id = db.Column(db.String(64), primary_key=True)

    run = db.relationship('Run')

class ProtocolPermission(BaseModel):
    __tablename__ = 'protocol_permission'

    protocol_id = db.Column(db.Integer, db.ForeignKey('protocol.id'), primary_key=True)
    user_id = db.Column(db.String(64), primary_key=True)

    protocol = db.relationship('Protocol')
