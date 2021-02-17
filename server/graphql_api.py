import graphene
import datetime

from sqlalchemy import and_
from graphene import relay
from graphene_pydantic import PydanticObjectType
from starlette.graphql import GraphQLApp
from pydantic import BaseModel
from typing import List, Optional
from fastapi import Request, Response, HTTPException
from fastapi.security.http import HTTPBearer

from database import Protocol, ProtocolVersion, Run, RunVersion, User, UserVersion, Sample, SampleVersion, versioned_row_to_dict
from models import SampleResult, ProtocolModel, RunModel, UserModel, SectionDefinition
from server import app, Session, get_current_user
from authorization import check_access
from crud.run import crud_get_runs, crud_get_run, crud_get_run_samples, crud_get_run_sample
from crud.protocol import crud_get_protocols, crud_get_protocol
from crud.user import crud_get_users, crud_get_user
from crud.sample import crud_get_samples, crud_get_sample

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

    page = graphene.Int(required=False)
    pageCount = graphene.Int(required=False)

class SampleNode(VersionedPydanticObjectType):
    class Meta:
        model = SampleResult
        interfaces = (relay.Node, )

    owner = relay.Node.Field(UserNode)

    @staticmethod
    def resolve_owner(root, info):
        with Session() as db:
            return UserModel.parse_obj(
                crud_get_user(
                    item_to_dict=lambda user: versioned_row_to_dict(row, row.current),
                    db=db,
                    current_user=current_user,
                    user_id=root.created_by,
                ),
            )

class SampleConnection(relay.Connection):
    class Meta:
        node = SampleNode

    page = graphene.Int(required=False)
    pageCount = graphene.Int(required=False)

class ProtocolNode(VersionedPydanticObjectType):
    class Meta:
        model = ProtocolModel
        interfaces = (relay.Node, )

    owner = graphene.Field(UserNode)

    @staticmethod
    def resolve_owner(root, info):
        with Session() as db:
            return UserModel.parse_obj(
                crud_get_user(
                    item_to_dict=lambda user: versioned_row_to_dict(row, row.current),
                    db=db,
                    current_user=current_user,
                    user_id=root.created_by,
                ),
            )

class ProtocolConnection(relay.Connection):
    class Meta:
        node = ProtocolNode

    page = graphene.Int(required=False)
    pageCount = graphene.Int(required=False)

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
            return UserModel.parse_obj(
                crud_get_user(
                    item_to_dict=lambda user: versioned_row_to_dict(row, row.current),
                    db=db,
                    current_user=current_user,
                    user_id=root.created_by,
                ),
            )

    @staticmethod
    def resolve_samples(root, info):
        with Session() as db:
            pagination_dict = crud_get_run_samples(
                item_to_dict=lambda sample: versioned_row_to_dict(row, row.current),
                
                db=db,
                current_user=current_user,

                run_id=root.id,

                page=page,
                per_page=per_page,
            )

            return SampleConnection(
                page=pagination_dict.get('page', None),
                pageCount=pagination_dict.get('pageCount', None),
                edges=[
                    SampleConnection.Edge(
                        node=SampleResult.parse_obj(r),
                        cursor=f"{pagination_dict.get('page', 1)}.{i}",
                    )
                    for i, r
                    in enumerate(pagination_dict['samples'])
                ],
                page_info=relay.PageInfo(
                    has_next_page=pagination_dict.get('page', 1) < pagination_dict.get('pageCount', 1),
                    has_previous_page=pagination_dict.get('page', 1) > pagination_dict.get('pageCount', 1),
                    start_cursor="1.0",
                    end_cursor=f"1.{len(pagination_dict['samples'])}" if pagination_dict.get('pageCount', None) is None else f"{pagination_dict['pageCount']}.{len(pagination_dict['samples'])}",
                ),
            )

class RunConnection(relay.Connection):
    class Meta:
        node = RunNode

    page = graphene.Int(required=False)
    pageCount = graphene.Int(required=False)


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

    @staticmethod
    def resolve_protocol(root, info, id: int):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        with Session() as db:
            model_dict = crud_get_protocol(
                item_to_dict=lambda protocol: versioned_row_to_dict(protocol, protocol.current),

                db=db,
                current_user=current_user,

                protocol_id=id,
                version_id=version_id,
            )
            return ProtocolModel.parse_obj(model_dict)

    @staticmethod
    def resolve_all_protocols(
        root,
        info,

        # Search parameters
        run: Optional[int] = None,
        plate: Optional[str] = None,
        reagent: Optional[str] = None,
        sample: Optional[str] = None,
        creator: Optional[str] = None,
        archived: Optional[bool] = None,

        # Paging parameters
        page: Optional[int] = None,
        per_page: Optional[int] = None,

        # Currently unused
        before: Optional[str] = None,
        after: Optional[str] = None,
        first: Optional[int] = None,
        last: Optional[int] = None,
    ):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        with Session() as db:
            pagination_dict = crud_get_protocols(
                item_to_dict=lambda protocol: versioned_row_to_dict(protocol, protocol.current),

                db=db,
                current_user=current_user,

                protocol=protocol,
                plate=plate,
                reagent=reagent,
                sample=sample,
                creator=creator,
                archived=archived,

                page=page,
                per_page=per_page,
            )

            return ProtocolConnection(
                page=pagination_dict.get('page', None),
                pageCount=pagination_dict.get('pageCount', None),
                edges=[
                    ProtocolConnection.Edge(
                        node=ProtocolModel.parse_obj(r),
                        cursor=f"{pagination_dict.get('page', 1)}.{i}",
                    )
                    for i, r
                    in enumerate(pagination_dict['protocols'])
                ],
                page_info=relay.PageInfo(
                    has_next_page=pagination_dict.get('page', 1) < pagination_dict.get('pageCount', 1),
                    has_previous_page=pagination_dict.get('page', 1) > pagination_dict.get('pageCount', 1),
                    start_cursor="1.0",
                    end_cursor=f"1.{len(pagination_dict['protocols'])}" if pagination_dict.get('pageCount', None) is None else f"{pagination_dict['pageCount']}.{len(pagination_dict['protocols'])}",
                ),
            )

    @staticmethod
    def resolve_run(
        root,
        info,
        
        id: int,
        version_id: int,
    ):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        with Session() as db:
            model_dict = crud_get_run(
                item_to_dict=lambda run: versioned_row_to_dict(run, run.current),

                db=db,
                current_user=current_user,

                run_id=id,
                version_id=version_id,
            )
            return RunModel.parse_obj(model_dict)

    @staticmethod
    def resolve_all_runs(
        root,
        info,

        # Search parameters
        protocol: Optional[int] = None,
        plate: Optional[str] = None,
        reagent: Optional[str] = None,
        sample: Optional[str] = None,
        creator: Optional[str] = None,
        archived: Optional[bool] = None,

        # Paging parameters
        page: Optional[int] = None,
        per_page: Optional[int] = None,

        # Currently unused
        before: Optional[str] = None,
        after: Optional[str] = None,
        first: Optional[int] = None,
        last: Optional[int] = None,
    ):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        with Session() as db:
            pagination_dict = crud_get_runs(
                item_to_dict=lambda run: versioned_row_to_dict(run, run.current),

                db=db,
                current_user=current_user,

                protocol=protocol,
                plate=plate,
                reagent=reagent,
                sample=sample,
                creator=creator,
                archived=archived,

                page=page,
                per_page=per_page,
            )

            return RunConnection(
                page=pagination_dict.get('page', None),
                pageCount=pagination_dict.get('pageCount', None),
                edges=[
                    RunConnection.Edge(
                        node=RunModel.parse_obj(r),
                        cursor=f"{pagination_dict.get('page', 1)}.{i}",
                    )
                    for i, r
                    in enumerate(pagination_dict['runs'])
                ],
                page_info=relay.PageInfo(
                    has_next_page=pagination_dict.get('page', 1) < pagination_dict.get('pageCount', 1),
                    has_previous_page=pagination_dict.get('page', 1) > pagination_dict.get('pageCount', 1),
                    start_cursor="1.0",
                    end_cursor=f"1.{len(pagination_dict['runs'])}" if pagination_dict.get('pageCount', None) is None else f"{pagination_dict['pageCount']}.{len(pagination_dict['runs'])}",
                ),
            )

    @staticmethod
    def resolve_user(root, info, id: str):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        with Session() as db:
            model_dict = crud_get_user(
                item_to_dict=lambda user: versioned_row_to_dict(user, user.current),

                db=db,
                current_user=current_user,

                user_id=id,
                version_id=version_id,
            )
            return UserModel.parse_obj(model_dict)

    @staticmethod
    def resolve_all_users(root, info):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        with Session() as db:
            pagination_dict = crud_get_users(
                item_to_dict=lambda user: versioned_row_to_dict(user, user.current),

                db=db,
                current_user=current_user,

                protocol=protocol,
                plate=plate,
                reagent=reagent,
                sample=sample,
                creator=creator,
                archived=archived,

                page=page,
                per_page=per_page,
            )

            return UserConnection(
                page=pagination_dict.get('page', None),
                pageCount=pagination_dict.get('pageCount', None),
                edges=[
                    UserConnection.Edge(
                        node=UserModel.parse_obj(r),
                        cursor=f"{pagination_dict.get('page', 1)}.{i}",
                    )
                    for i, r
                    in enumerate(pagination_dict['users'])
                ],
                page_info=relay.PageInfo(
                    has_next_page=pagination_dict.get('page', 1) < pagination_dict.get('pageCount', 1),
                    has_previous_page=pagination_dict.get('page', 1) > pagination_dict.get('pageCount', 1),
                    start_cursor="1.0",
                    end_cursor=f"1.{len(pagination_dict['users'])}" if pagination_dict.get('pageCount', None) is None else f"{pagination_dict['pageCount']}.{len(pagination_dict['users'])}",
                ),
            )

    @staticmethod
    def resolve_sample(root, info, sample_id: str, plate_id: str, run_version_id: int, protocol_version_id: int):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        with Session() as db:
            model_dict = crud_get_sample(
                item_to_dict=lambda sample: versioned_row_to_dict(sample, sample.current),

                db=db,
                current_user=current_user,

                sample_id=sample_id,
                plate_id=plate_id,
                run_version_id=run_version_id,
                protocol_version_id=protocol_version_id,
                version_id=version_id,
            )
            return SampleResult.parse_obj(model_dict)

    @staticmethod
    def resolve_all_samples(root, info):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        with Session() as db:
            pagination_dict = crud_get_samples(
                item_to_dict=lambda sample: versioned_row_to_dict(sample, sample.current),

                db=db,
                current_user=current_user,

                protocol=protocol,
                plate=plate,
                reagent=reagent,
                sample=sample,
                creator=creator,
                archived=archived,

                page=page,
                per_page=per_page,
            )

            return SampleConnection(
                page=pagination_dict.get('page', None),
                pageCount=pagination_dict.get('pageCount', None),
                edges=[
                    SampleConnection.Edge(
                        node=SampleResult.parse_obj(r),
                        cursor=f"{pagination_dict.get('page', 1)}.{i}",
                    )
                    for i, r
                    in enumerate(pagination_dict['samples'])
                ],
                page_info=relay.PageInfo(
                    has_next_page=pagination_dict.get('page', 1) < pagination_dict.get('pageCount', 1),
                    has_previous_page=pagination_dict.get('page', 1) > pagination_dict.get('pageCount', 1),
                    start_cursor="1.0",
                    end_cursor=f"1.{len(pagination_dict['samples'])}" if pagination_dict.get('pageCount', None) is None else f"{pagination_dict['pageCount']}.{len(pagination_dict['samples'])}",
                ),
            )


@app.middleware("http")
async def add_current_user(request: Request, call_next):
    # Only do the following if this is the graphql app.
    if request.url.path == "/graphql":
        try:
            request.state.user = await get_current_user(await HTTPBearer()(request))
        except HTTPException as ex:
            return Response(ex.detail, media_type="text/plain", status_code=ex.status_code)

    return await call_next(request)


schema = graphene.Schema(query=Query)

app.add_route("/graphql", GraphQLApp(schema=schema))
