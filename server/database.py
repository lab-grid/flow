"""Database models and utilities."""

import copy
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

def jsonRow2dict(row):
    """Converts a flask-sqlalchemy db row object with a single JSON data column
    into a plain python dictionary

    Args:
        row (BaseModel): The db row object
    """
    d = copy.deepcopy(row.data) if row.data else {}
    if row.id:
        d['id'] = row.id

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

class User(BaseModel):
    __tablename__ = 'user'

    id = db.Column(db.String(64), primary_key=True)
    data = db.Column(db.JSON())

class Run(BaseModel):
    __tablename__ = 'run'

    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.JSON())

class Protocol(BaseModel):
    __tablename__ = 'protocol'

    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.JSON())
