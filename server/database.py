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

class Run(BaseModel):
    __tablename__ = 'run'

    id = db.Column(db.Integer, primary_key=True)
    protocol_id = db.Column(db.Integer, db.ForeignKey('protocol.id'), nullable=True)
    name = db.Column(db.String(512))
    notes = db.Column(db.Text())
    # tags = db.Column(db.Integer, nullable=False)
    data_link = db.Column(db.Text())

class Protocol(BaseModel):
    __tablename__ = 'protocol'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(512))
    notes = db.Column(db.Text())
    # tags = db.Column(db.Integer, nullable=False)
    # data_link = db.Column(db.Text())

class LayerValue(BaseModel):
    __tablename__ = 'layer_value'

    layer_id = db.Column(db.Integer, db.ForeignKey('layer.id'), primary_key=True)
    row = db.Column(db.Integer, primary_key=True)
    column = db.Column(db.Integer, primary_key=True)

    compound_id = db.Column(db.Integer, db.ForeignKey('compound.id'), nullable=True)
    value = db.Column(db.Numeric(64, 32))

    layer = db.relationship('Layer')
    compound = db.relationship('Compound')

class Layer(BaseModel):
    __tablename__ = 'layer'

    id = db.Column(db.Integer, primary_key=True)
    derivation_id = db.Column(db.Integer, db.ForeignKey('derivation.id'), nullable=True)
    run_id = db.Column(db.Integer, db.ForeignKey('run.id'), nullable=False)
    name = db.Column(db.String(512))
    formula = db.Column(db.String(512))
    row_count = db.Column(db.Integer)
    column_count = db.Column(db.Integer)

    derivation = db.relationship('Derivation')
    run = db.relationship('Run')

class Derivation(BaseModel):
    __tablename__ = 'derivation'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(512))
    notes = db.Column(db.Text())
    formula = db.Column(db.String(512))

class Compound(BaseModel):
    __tablename__ = 'compound'

    id = db.Column(db.Integer, primary_key=True)
    compound_id = db.Column(db.String(256))
    batch_id = db.Column(db.Integer)
    target_id = db.Column(db.String(256))


# TEMPORARY -------------------------------------------------------------------

class DemoRun(BaseModel):
    __tablename__ = 'demo_run'

    id = db.Column(db.Integer, primary_key=True)
    data = db.Column(db.JSON())


class DemoRunPermission(BaseModel):
    __tablename__ = 'demo_run_permission'

    demo_run_id = db.Column(db.Integer, db.ForeignKey('demo_run.id'), primary_key=True)
    user_id = db.Column(db.String(64), primary_key=True)

    demo_run = db.relationship('DemoRun')
