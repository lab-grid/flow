"""Database models and utilities."""

import copy
import pprint
from server import db
from sqlalchemy import and_, or_
from sqlalchemy.sql.expression import column, literal_column
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func, text
from sqlalchemy.orm.attributes import flag_modified
# from alembic_utils.pg_view import PGView


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

def versioned_row_to_dict(api, row, row_version):
    """Convert a sqlalchemy row object into a plain python dictionary.

    Assumes that row object contains the following columns:
    - id (int)
    - created_on (datetime)
    - created_by (string(64))

    Assumes that row_version object contains the following columns:
    - id (int)
    - data (JSONB) Contains the rest of the fields as a single JSON column in postgres
    - updated_on (datetime)
    - updated_by (string(64))

    Args:
        row (BaseModel): The db row object
    """
    d = copy.deepcopy(row_version.data) if row_version and row_version.data else {}
    if row.id:
        d['id'] = row.id
    if row.created_on:
        d['created_on'] = row.created_on
    if row.created_by:
        try:
            d['created_by'] = row.owner.current.data["email"]
        except Exception as ex:
            api.logger.error("Failed to get user email: %s", ex)
    if row_version.id:
        d['version_id'] = row_version.id
    if row_version.updated_on:
        d['updated_on'] = row_version.updated_on
    if row_version.server_version:
        d['server_version'] = row_version.server_version
    if row_version.webapp_version:
        d['webapp_version'] = row_version.webapp_version
    if row_version.updated_by:
        try:
            d['updated_by'] = row_version.updator.current.data["email"]
        except Exception as ex:
            api.logger.error("Failed to get user email: %s", ex)

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
    d.pop('server_version', None)
    return d

def run_to_sample(sample):
    d = copy.deepcopy(sample.current.data) if sample.current and sample.current.data else {}
    if sample.sample_id:
        d['sampleID'] = sample.sample_id
    if sample.plate_id:
        d['plateID'] = sample.plate_id
    if sample.run_version and sample.run_version.run_id:
        d['runID'] = sample.run_version.run_id
    if sample.protocol_version and sample.protocol_version.protocol_id:
        d['protocolID'] = sample.protocol_version.protocol_id
    return d


# Searching -------------------------------------------------------------------


def filter_by_plate_label(run_version_query, plate_id):
    return run_version_query.filter(
        or_(
            func.jsonb_path_exists(RunVersion.data, f'$.sections[*].blocks[*].plateLabels."{plate_id}"'),
            func.jsonb_path_exists(RunVersion.data, f'$.sections[*].blocks[*].mappings."{plate_id}"'),
            func.jsonb_path_match(RunVersion.data, f'exists($.sections[*].blocks[*].plateLabel ? (@ == "{plate_id}"))')
        )
    )

def filter_by_reagent_label(run_version_query, reagent_id):
    return run_version_query.filter(
        func.jsonb_path_match(RunVersion.data, f'exists($.sections[*].blocks[*].definition.reagentLabel ? (@ == "{reagent_id}"))')
    )

def filter_by_sample_label(run_version_query, sample_id):
    return run_version_query.filter(
        func.jsonb_path_match(RunVersion.data, f'exists($.sections[*].blocks[*].plates[*].coordinates[*].sampleLabel ? (@ == "{sample_id}"))')
    )


# Tables ----------------------------------------------------------------------

class BaseModel(db.Model):
    __abstract__ = True
    def __repr__(self):
        return pprint.pformat(self.__dict__)

    is_deleted = db.Column(db.Boolean, default=False)
    created_on = db.Column(db.DateTime, default=db.func.now())

    @declared_attr
    def created_by(cls):
        return db.Column(db.String(64), db.ForeignKey('user.id'))

    @declared_attr
    def owner(cls):
        return db.relationship('User', primaryjoin=cls.__name__+'.created_by==User.id')

class BaseVersionModel(db.Model):
    __abstract__ = True

    server_version = db.Column(db.String(40))
    webapp_version = db.Column(db.String(40))
    updated_on = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    @declared_attr
    def updated_by(cls):
        return db.Column(db.String(64), db.ForeignKey('user.id'))

    @declared_attr
    def updator(cls):
        return db.relationship('User', primaryjoin=cls.__name__+'.updated_by==User.id')

class Attachment(BaseModel):
    __tablename__ = 'attachment'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(256))
    mimetype = db.Column(db.String(64))
    data = db.Column(db.LargeBinary)

class UserVersion(BaseVersionModel):
    __tablename__ = 'user_version'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(64), db.ForeignKey('user.id', ondelete='CASCADE'))
    data = db.Column(JSONB)

    user = db.relationship('User', primaryjoin='UserVersion.user_id==User.id')

class User(BaseModel):
    __tablename__ = 'user'

    id = db.Column(db.String(64), primary_key=True)
    version_id = db.Column(db.Integer, db.ForeignKey('user_version.id', use_alter=True))

    current = db.relationship(
        UserVersion,
        primaryjoin='User.version_id==UserVersion.id',
        post_update=True,
    )
    history = db.relationship(
        UserVersion,
        primaryjoin='User.id==UserVersion.user_id',
        post_update=True,
        back_populates="user",
        cascade="all, delete",
        order_by=UserVersion.updated_on,
    )

class ProtocolVersion(BaseVersionModel):
    __tablename__ = 'protocol_version'

    id = db.Column(db.Integer, primary_key=True)
    protocol_id = db.Column(db.Integer, db.ForeignKey('protocol.id', ondelete='CASCADE'))
    data = db.Column(JSONB)

    protocol = db.relationship('Protocol', primaryjoin='ProtocolVersion.protocol_id==Protocol.id')

class Protocol(BaseModel):
    __tablename__ = 'protocol'

    id = db.Column(db.Integer, primary_key=True)
    version_id = db.Column(db.Integer, db.ForeignKey('protocol_version.id', use_alter=True))

    current = db.relationship(
        ProtocolVersion,
        primaryjoin='Protocol.version_id==ProtocolVersion.id',
        post_update=True,
    )
    history = db.relationship(
        ProtocolVersion,
        primaryjoin='Protocol.id==ProtocolVersion.protocol_id',
        post_update=True,
        back_populates="protocol",
        cascade="all, delete",
        order_by=UserVersion.updated_on,
    )

class RunVersionAttachment(db.Model):
    __tablename__ = 'run_version_attachment'

    id = db.Column(db.Integer, primary_key=True)
    run_version_id = db.Column(db.Integer, db.ForeignKey('run_version.id', ondelete='CASCADE'))
    attachment_id = db.Column(db.Integer, db.ForeignKey('attachment.id', ondelete='CASCADE'))

    run_version = db.relationship('RunVersion', primaryjoin='RunVersionAttachment.run_version_id==RunVersion.id')
    attachment = db.relationship('RunVersion', primaryjoin='RunVersionAttachment.run_version_id==RunVersion.id')

class RunVersion(BaseVersionModel):
    __tablename__ = 'run_version'

    id = db.Column(db.Integer, primary_key=True)
    run_id = db.Column(db.Integer, db.ForeignKey('run.id', ondelete='CASCADE'))
    data = db.Column(JSONB)

    run = db.relationship('Run', primaryjoin='RunVersion.run_id==Run.id')
    attachments = db.relationship('Attachment', secondary='run_version_attachment')

class Run(BaseModel):
    __tablename__ = 'run'

    id = db.Column(db.Integer, primary_key=True)
    version_id = db.Column(db.Integer, db.ForeignKey('run_version.id', use_alter=True))
    protocol_version_id = db.Column(db.Integer, db.ForeignKey('protocol_version.id', use_alter=True))

    current = db.relationship(
        RunVersion,
        primaryjoin='Run.version_id==RunVersion.id',
        post_update=True,
    )
    protocol_version = db.relationship(
        ProtocolVersion,
        primaryjoin='Run.protocol_version_id==ProtocolVersion.id',
    )
    history = db.relationship(
        RunVersion,
        primaryjoin='Run.id==RunVersion.run_id',
        post_update=True,
        back_populates="run",
        cascade="all, delete",
        order_by=UserVersion.updated_on,
    )

class SampleVersion(BaseVersionModel):
    __tablename__ = 'sample_version'

    id = db.Column(db.Integer, primary_key=True)

    sample_id = db.Column(db.String(64))
    plate_id = db.Column(db.String(64))
    run_version_id = db.Column(db.Integer)
    protocol_version_id = db.Column(db.Integer)

    data = db.Column(JSONB)

    sample = db.relationship(
        'Sample',
        primaryjoin='(SampleVersion.sample_id==Sample.sample_id) | (SampleVersion.plate_id==Sample.plate_id) | (SampleVersion.run_version_id==Sample.run_version_id) | (SampleVersion.protocol_version_id==Sample.protocol_version_id)'
    )

    __table_args__ = (
        db.ForeignKeyConstraint(
            [sample_id, plate_id, run_version_id, protocol_version_id],
            ['sample.sample_id', 'sample.plate_id', 'sample.run_version_id', 'sample.protocol_version_id'],
        ),
        {},
    )

class Sample(BaseModel):
    __tablename__ = 'sample'

    sample_id = db.Column(db.String(64), primary_key=True)
    plate_id = db.Column(db.String(64), primary_key=True)
    run_version_id = db.Column(db.Integer, db.ForeignKey('run_version.id', use_alter=True), primary_key=True)
    protocol_version_id = db.Column(db.Integer, db.ForeignKey('protocol_version.id', use_alter=True), primary_key=True)

    version_id = db.Column(db.Integer, db.ForeignKey('sample_version.id', use_alter=True))

    current = db.relationship(
        SampleVersion,
        primaryjoin='Sample.version_id==SampleVersion.id',
        post_update=True,
    )
    protocol_version = db.relationship(
        ProtocolVersion,
        primaryjoin='Sample.protocol_version_id==ProtocolVersion.id',
    )
    run_version = db.relationship(
        RunVersion,
        primaryjoin='Sample.run_version_id==RunVersion.id',
    )
    history = db.relationship(
        SampleVersion,
        primaryjoin='(Sample.sample_id==SampleVersion.sample_id) | (Sample.plate_id==SampleVersion.plate_id) | (Sample.run_version_id==SampleVersion.run_version_id) | (Sample.protocol_version_id==SampleVersion.protocol_version_id)',
        post_update=True,
        back_populates="sample",
        cascade="all, delete",
        order_by=SampleVersion.updated_on,
    )
