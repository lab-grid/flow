import graphene
import datetime

from sqlalchemy import and_
from graphene import relay
from graphene_pydantic import PydanticObjectType
from starlette.graphql import GraphQLApp
from pydantic import BaseModel
from typing import List
from fastapi import Request, Response, HTTPException
from fastapi.security.http import HTTPBearer

from database import Protocol, ProtocolVersion, Run, RunVersion, User, UserVersion, Sample, SampleVersion, versioned_row_to_dict
from models import SampleResult, ProtocolModel, RunModel, UserModel, SectionDefinition
from server import app, Session, get_current_user

import models


class AttachmentSchema(PydanticObjectType):
    class Meta:
        model = models.AttachmentModel

class PlateCoordinateSchema(PydanticObjectType):
    class Meta:
        model = models.PlateCoordinate

class PlateResultSchema(PydanticObjectType):
    class Meta:
        model = models.PlateResult

class BlockOptionSchema(PydanticObjectType):
    class Meta:
        model = models.BlockOption

class BlockPrimerSchema(PydanticObjectType):
    class Meta:
        model = models.BlockPrimer

class BlockParamSchema(PydanticObjectType):
    class Meta:
        model = models.BlockParam

class BlockVariableSchema(PydanticObjectType):
    class Meta:
        model = models.BlockVariable

class BlockPlateMarkerEntrySchema(PydanticObjectType):
    class Meta:
        model = models.BlockPlateMarkerEntry

class BlockPlateSchema(PydanticObjectType):
    class Meta:
        model = models.BlockPlate

class TextQuestionBlockDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.TextQuestionBlockDefinition

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.TextQuestionBlockDefinition))

class OptionsQuestionBlockDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.OptionsQuestionBlockDefinition

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.OptionsQuestionBlockDefinition))

class CalculatorBlockDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.CalculatorBlockDefinition

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.CalculatorBlockDefinition))

class PlateSamplerBlockDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.PlateSamplerBlockDefinition

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.PlateSamplerBlockDefinition))

class PlateAddReagentBlockDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.PlateAddReagentBlockDefinition

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.PlateAddReagentBlockDefinition))

class AddReagentBlockDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.AddReagentBlockDefinition

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.AddReagentBlockDefinition))

class StartTimestampBlockDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.StartTimestampBlockDefinition

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.StartTimestampBlockDefinition))

class EndTimestampBlockDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.EndTimestampBlockDefinition

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.EndTimestampBlockDefinition))

class StartPlateSequencerBlockDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.StartPlateSequencerBlockDefinition

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.StartPlateSequencerBlockDefinition))

class EndPlateSequencerBlockDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.EndPlateSequencerBlockDefinition

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.EndPlateSequencerBlockDefinition))

class SectionDefinitionSchema(PydanticObjectType):
    class Meta:
        model = models.SectionDefinition


# Run -------------------------------------------------------------------------

class VariableValueSchema(PydanticObjectType):
    class Meta:
        model = models.VariableValue

class PlateMappingSchema(PydanticObjectType):
    class Meta:
        model = models.PlateMapping

class TextQuestionBlockSchema(PydanticObjectType):
    class Meta:
        model = models.TextQuestionBlock

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.TextQuestionBlock))

class OptionsQuestionBlockSchema(PydanticObjectType):
    class Meta:
        model = models.OptionsQuestionBlock

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.OptionsQuestionBlock))

class CalculatorBlockSchema(PydanticObjectType):
    class Meta:
        model = models.CalculatorBlock

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.CalculatorBlock))

class PlateSamplerBlockSchema(PydanticObjectType):
    class Meta:
        model = models.PlateSamplerBlock

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.PlateSamplerBlock))

class PlateAddReagentBlockSchema(PydanticObjectType):
    class Meta:
        model = models.PlateAddReagentBlock

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.PlateAddReagentBlock))

class AddReagentBlockSchema(PydanticObjectType):
    class Meta:
        model = models.AddReagentBlock

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.AddReagentBlock))

class StartTimestampBlockSchema(PydanticObjectType):
    class Meta:
        model = models.StartTimestampBlock

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.StartTimestampBlock))

class EndTimestampBlockSchema(PydanticObjectType):
    class Meta:
        model = models.EndTimestampBlock

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.EndTimestampBlock))

class StartPlateSequencerBlockSchema(PydanticObjectType):
    class Meta:
        model = models.StartPlateSequencerBlock

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.StartPlateSequencerBlock))

class EndPlateSequencerBlockSchema(PydanticObjectType):
    class Meta:
        model = models.EndPlateSequencerBlock

    @classmethod
    def is_type_of(cls, root, info):
        return isinstance(root, (cls, models.EndPlateSequencerBlock))

class SectionSchema(PydanticObjectType):
    class Meta:
        model = models.Section


class VersionedPydanticObjectType(PydanticObjectType):
    class Meta:
        abstract = True

    @classmethod
    def get_node(cls, info, id):
        with Session() as db:
            row = db.query(cls._meta.db_model)\
                .filter(and_(
                    cls._meta.db_model.is_deleted != True,
                    cls._meta.db_model.id == id,
                ))\
                .first()
            return cls._meta.model.parse_obj(versioned_row_to_dict(row, row.current))


class UserNode(VersionedPydanticObjectType):
    class Meta:
        model = UserModel
        interfaces = (relay.Node, )

class UserConnection(relay.Connection):
    class Meta:
        node = UserNode

class SampleNode(VersionedPydanticObjectType):
    class Meta:
        model = SampleResult
        interfaces = (relay.Node, )

    owner = relay.Node.Field(UserNode)

    @staticmethod
    def resolve_owner(root, info):
        with Session() as db:
            row = db.query(User)\
                .filter(and_(
                    User.is_deleted != True,
                    User.id == root.created_by,
                ))\
                .first()
            return UserModel.parse_obj(versioned_row_to_dict(row, row.current))

class SampleConnection(relay.Connection):
    class Meta:
        node = SampleNode

class ProtocolNode(VersionedPydanticObjectType):
    class Meta:
        model = ProtocolModel
        interfaces = (relay.Node, )

    owner = graphene.Field(UserNode)

    @staticmethod
    def resolve_owner(root, info):
        with Session() as db:
            row = db.query(User)\
                .filter(and_(
                    User.is_deleted != True,
                ))\
                .join(Protocol, and_(
                    Protocol.id == root.id,
                    Protocol.created_by == User.id,
                ))\
                .first()
            return UserModel.parse_obj(versioned_row_to_dict(row, row.current))

class ProtocolConnection(relay.Connection):
    class Meta:
        node = ProtocolNode

class RunNode(VersionedPydanticObjectType):
    class Meta:
        model = RunModel
        interfaces = (relay.Node, )

    protocol = relay.Node.Field(ProtocolNode)
    owner = relay.Node.Field(UserNode)
    samples = relay.ConnectionField(SampleConnection)

    @staticmethod
    def resolve_protocol(root, info):
        with Session() as db:
            row_version = db.query(ProtocolVersion)\
                .join(Run, and_(
                    Run.id == root.id,
                    Run.protocol_version_id == ProtocolVersion.id,
                ))\
                .first()
            return ProtocolModel.parse_obj(versioned_row_to_dict(row_version.protocol, row_version))

    @staticmethod
    def resolve_owner(root, info):
        with Session() as db:
            row = db.query(User)\
                .filter(and_(
                    User.is_deleted != True,
                    User.id == root.created_by,
                ))\
                .first()
            return UserModel.parse_obj(versioned_row_to_dict(row, row.current))

    @staticmethod
    def resolve_samples(root, info):
        with Session() as db:
            rows = db.query(Sample)\
                .filter(and_(
                    Sample.is_deleted != True,
                ))\
                .join(Run, and_(
                    Run.id == root.id,
                    Run.version_id == Sample.run_version_id,
                ))\
                .distinct()
            return [
                SampleResult.parse_obj(versioned_row_to_dict(row, row.current))
                for row
                in rows
            ]

class RunConnection(relay.Connection):
    class Meta:
        node = RunNode


def get_current_user_from_request(request: Request):
    return getattr(request.state, 'user', None)


class Query(graphene.ObjectType):
    node = relay.Node.Field()

    protocol = relay.Node.Field(ProtocolNode)
    all_protocols = relay.ConnectionField(ProtocolConnection)
    run = relay.Node.Field(RunNode)
    all_runs = relay.ConnectionField(RunConnection)
    user = relay.Node.Field(UserNode)
    all_users = relay.ConnectionField(UserConnection)
    sample = relay.Node.Field(SampleNode)
    all_samples = relay.ConnectionField(SampleConnection)

    def resolve_protocol(root, info, id: int):
        current_user = get_current_user_from_request(info.context['request'])

        if not check_access(user=current_user.username, path=f"/protocol/{id}", method="GET"):
            raise HTTPException(403, f"User {current_user.username} does not have access to GET /protocol/{id}")

        with Session() as db:
            row = db.query(Protocol).get(id)
            return ProtocolModel.parse_obj(versioned_row_to_dict(row, row.current))

    @staticmethod
    def resolve_all_protocols(root, info):
        current_user = get_current_user_from_request(info.context['request'])

        with Session() as db:
            rows = db.query(Protocol).all()
            return [
                ProtocolModel.parse_obj(versioned_row_to_dict(row, row.current))
                for row
                in rows
                if check_access(user=current_user.username, path=f"/protocol/{row.id}", method="GET")
            ]

    def resolve_run(root, info, id: int):
        current_user = get_current_user_from_request(info.context['request'])

        if not check_access(user=current_user.username, path=f"/run/{id}", method="GET"):
            raise HTTPException(403, f"User {current_user.username} does not have access to GET /run/{id}")

        with Session() as db:
            row = db.query(Run).get(id)
            return RunModel.parse_obj(versioned_row_to_dict(row, row.current))

    @staticmethod
    def resolve_all_runs(root, info):
        current_user = get_current_user_from_request(info.context['request'])

        with Session() as db:
            rows = db.query(Run).all()
            return [
                RunModel.parse_obj(versioned_row_to_dict(row, row.current))
                for row
                in rows
                if check_access(user=current_user.username, path=f"/run/{row.id}", method="GET")
            ]

    def resolve_user(root, info, id: str):
        current_user = get_current_user_from_request(info.context['request'])

        if not check_access(user=current_user.username, path=f"/user/{id}", method="GET"):
            raise HTTPException(403, f"User {current_user.username} does not have access to GET /user/{id}")

        with Session() as db:
            row = db.query(User).get(id)
            return UserModel.parse_obj(versioned_row_to_dict(row, row.current))

    @staticmethod
    def resolve_all_users(root, info):
        current_user = get_current_user_from_request(info.context['request'])

        with Session() as db:
            rows = db.query(User).all()
            return [
                UserModel.parse_obj(versioned_row_to_dict(row, row.current))
                for row
                in rows
                if check_access(user=current_user.username, path=f"/user/{row.id}", method="GET")
            ]

    def resolve_sample(root, info, sample_id: str, plate_id: str, run_version_id: int, protocol_version_id: int):
        current_user = get_current_user_from_request(info.context['request'])

        with Session() as db:
            row = db.query(Sample).get((sample_id, plate_id, run_version_id, protocol_version_id))

            if not check_access(user=current_user.username, path=f"/run/{row.run_version.run_id}", method="GET"):
                raise HTTPException(403, f"User {current_user.username} does not have access to GET sample ({sample_id}, {plate_id}, {run_version_id}, {protocol_version_id})")

            return SampleModel.parse_obj(versioned_row_to_dict(row, row.current))

    @staticmethod
    def resolve_all_samples(root, info):
        current_user = get_current_user_from_request(info.context['request'])

        with Session() as db:
            rows = db.query(Sample).all()
            return [
                SampleModel.parse_obj(versioned_row_to_dict(row, row.current))
                for row
                in rows
                if check_access(user=current_user.username, path=f"/run/{row.run_version.run_id}", method="GET")
            ]

@app.middleware("http")
async def add_current_user(request: Request, call_next):
    # Only do the following if this is the graphql app.
    if request.url.path == "/graphql":
        try:
            request.state.user = await get_current_user(await HTTPBearer()(request))
        except HTTPException as ex:
            return Response(ex.detail, media_type="text/plain", status_code=ex.status_code)

    return await call_next(request)

app.add_route("/graphql", GraphQLApp(schema=graphene.Schema(query=Query)))
