"""Database models and utilities."""

import copy
import pprint
from server import db
from sqlalchemy.sql.expression import literal_column
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
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
    d = copy.deepcopy(row_version.data) if row_version.data else {}
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
    return d


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

    updated_on = db.Column(db.DateTime, default=db.func.now(), onupdate=db.func.now())

    @declared_attr
    def updated_by(cls):
        return db.Column(db.String(64), db.ForeignKey('user.id'))

    @declared_attr
    def updator(cls):
        return db.relationship('User', primaryjoin=cls.__name__+'.updated_by==User.id')

class UserVersion(BaseVersionModel):
    __tablename__ = 'user_version'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(64), db.ForeignKey('user.id'))
    data = db.Column(JSONB)

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
    data = db.Column(JSONB)

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
    data = db.Column(JSONB)

    run = db.relationship('Run', primaryjoin='RunVersion.run_id==Run.id')

class Run(BaseModel):
    __tablename__ = 'run'

    id = db.Column(db.Integer, primary_key=True)
    version_id = db.Column(db.Integer, db.ForeignKey('run_version.id', use_alter=True))
    protocol_version_id = db.Column(db.Integer, db.ForeignKey('protocol_version.id', use_alter=True))

    current = db.relationship(RunVersion, primaryjoin='Run.version_id==RunVersion.id', post_update=True)
    protocol_version = db.relationship(ProtocolVersion, primaryjoin='Run.protocol_version_id==ProtocolVersion.id')


# -----------------------------------------------------------------------------
# Samples
# -----------------------------------------------------------------------------

# sample_view = PGView(
#     schema="public",
#     signature="sample_view",
#     # TODO: Come up with a query that generates a samples table.
#     definition="select block.val from public.run join public.run_version on public.run.version_id = public.run_version.id join lateral json_array_elements(public.run_version.data::json->'sections') as sec(val) on true join lateral json_array_elements(sec.val::json->'blocks') as block(val) on true"
# )

def get_samples(plate_id=None, protocol_id=None, run_id=None):
    """
    SELECT
        public.protocol_version.protocol_id as protocolID,
        aggSample.runID as runID,
        aggSample.plateID AS plateID,
        aggSample.plateRow AS plateRow,
        aggSample.plateCol AS plateCol,
        aggSample.sampleID AS sampleID,
        aggResult.marker1 AS marker1,
        aggResult.marker2 AS marker2,
        aggResult.result AS result
    FROM
        (
            SELECT
                sample.key AS plateID,
                (sample.value::jsonb->'row')::int AS plateRow,
                (sample.value::jsonb->'col')::int AS plateCol,
                (sample.value::jsonb->'sampleLabel')::text AS sampleID,
                public.run.id as runID
            FROM
                public.run,
                public.run_version,
                jsonb_path_query(public.run_version.data, '$.sections[*].blocks[*].plateMappings') AS plateMappings,
                jsonb_each(plateMappings) AS sample
            WHERE public.run_version.id = public.run.version_id
        ) AS aggSample,
        (
            SELECT
                (result::jsonb->'plateLabel')::text AS plateID,
                (result::jsonb->'plateRow')::int AS plateRow,
                (result::jsonb->'plateCol')::int AS plateCol,
                (result::jsonb->'marker1')::text AS marker1,
                (result::jsonb->'marker2')::text AS marker2,
                (result::jsonb->'classification')::text AS result,
                public.run.id as runID
            FROM
                public.run,
                public.run_version,
                jsonb_path_query(public.run_version.data, '$.sections[*].blocks[*].plateSequencingResults[*]') AS result
            WHERE public.run_version.id = public.run.version_id
        ) AS aggResult,
        public.protocol_version
    WHERE aggSample.plateRow = aggResult.plateRow
    AND aggSample.plateCol = aggResult.plateCol
    AND aggSample.plateID = aggResult.plateID
    AND public.protocol_version.id = aggSample.runID;
    """
    func_plate_mappings = db.func.jsonb_path_query(RunVersion.data, '$.sections[*].blocks[*].plateMappings')
    func_sample = db.func.jsonb_each(func_plate_mappings).alias('sample')
    func_result = db.func.jsonb_path_query(RunVersion.data, '$.sections[*].blocks[*].plateSequencingResults[*]')

    sample_query = db.session\
        .query(
            Run.protocol_version_id.label('protocolVersionID'),
            Run.id.label('runID'),
            literal_column('sample.key').label('plateID'),
            literal_column('sample.value', type_=JSONB)['row'].cast('int').label('plateRow'),
            literal_column('sample.value', type_=JSONB)['col'].cast('int').label('plateCol'),
            literal_column('sample.value', type_=JSONB)['sampleLabel'].cast('text').label('sampleID'),
            # func_sample.c.key.label('plateID'),
            # func_sample.c.value['row'].cast('int').label('plateRow'),
            # func_sample.c.value['col'].cast('int').label('plateCol'),
            # func_sample.c.value['sampleLabel'].cast('text').label('sampleID'),
        )\
        .join(RunVersion, RunVersion.id == Run.version_id)\
        .filter(Run.is_deleted != True)\
        .subquery()
    result_query = db.session\
        .query(
            Run.id.label('runID'),
            func_result['plateLabel'].cast('text').label('plateID'),
            func_result['plateRow'].cast('int').label('plateRow'),
            func_result['plateCol'].cast('int').label('plateCol'),
            func_result['marker1'].cast('text').label('marker1'),
            func_result['marker2'].cast('text').label('marker2'),
            func_result['classification'].cast('text').label('result'),
        )\
        .join(RunVersion, RunVersion.id == Run.version_id)\
        .filter(Run.is_deleted != True)\
        .subquery()
    return db.session\
        .query(
            ProtocolVersion.protocol_id.label('protocolID'),
            sample_query.c.runID.label('runID'),
            sample_query.c.plateID.label('plateID'),
            sample_query.c.plateRow.label('plateRow'),
            sample_query.c.plateCol.label('plateCol'),
            sample_query.c.sampleID.label('sampleID'),
            result_query.c.marker1.label('marker1'),
            result_query.c.marker2.label('marker2'),
            result_query.c.result.label('result'),
        )\
        .join(result_query, sample_query.c.plateRow == result_query.c.plateRow)\
        .join(result_query, sample_query.c.plateCol == result_query.c.plateCol)\
        .join(result_query, sample_query.c.plateID == result_query.c.plateID)\
        .join(ProtocolVersion, sample_query.c.protocolVersionID == ProtocolVersion.id)

    # """
    # SELECT
    #     sample.value AS sampleID,
    #     public.run.id as runID,
    #     public.protocol_version.protocol_id as protocolID,
    #     public.run_version.data as runData
    # #     ? as result,
    # #     ? as signer,
    # #     ? as witness,
    # #     ? as completedOn
    # FROM public.run, public.run_version, public.protocol_version, jsonb_path_query(public.run_version.data, '$.sections[*].blocks[*].plateMappings[*].sampleLabel') AS sample
    # WHERE public.run_version.id = public.run.version_id
    # WHERE public.protocol_version.id = public.run_version.protocol_version_id
    # """
    # sample_query = db.func.jsonb_path_query(RunVersion.data, '$.sections[*].blocks[*].plateMappings[*].sampleLabel')
    # return db.session\
    #     .query(Run, RunVersion, ProtocolVersion, sample_query)\
    #     .join(RunVersion, RunVersion.id == Run.version_id)\
    #     .join(ProtocolVersion, ProtocolVersion.id == Run.protocol_version_id)\
    #     .filter(Run.is_deleted != True)

# def run_to_sample(run, run_version, protocol_version, sample_id):
#     return {
#         'sampleID': sample.value,
#         'runID': run.id,
#         'protocolID': protocol_version.protocol_id,
#         'result': run_version.data['sections'],
#         # 'signer': ???,
#         # 'completedOn': ???,
#     }


def run_to_sample(sample):
    import pprint
    pprint.print('======== DEBUGGING START ========')
    pprint.print(sample)
    pprint.print('========  DEBUGGING END  ========')
    return {}
