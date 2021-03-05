import graphene

from sqlalchemy import and_
from graphql.execution.base import ResolveInfo
from graphene import relay
from graphene_pydantic import PydanticObjectType
from typing import Optional
from fastapi import HTTPException

from database import Protocol, ProtocolVersion, Run, RunVersion, versioned_row_to_dict
from api_graphql.crud import get_current_user_from_request, get_session, graphql_ast_flatten_field, graphql_crud_get_protocols, graphql_crud_get_runs, graphql_crud_get_samples
from models import SampleResult, ProtocolModel, RunModel, UserModel
from crud.run import crud_get_run, crud_get_run_samples
from crud.protocol import crud_get_protocol
from crud.user import crud_get_users, crud_get_user
from crud.sample import crud_get_sample

import models


# Helpers ---------------------------------------------------------------------

def add_ids(input: dict, **kwargs) -> dict:
    for key, value in kwargs.items():
        input[key] = value
    return input


# Pydantic Schema Classes -----------------------------------------------------

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
    def get_node(cls, info: ResolveInfo, id):
        db = get_session(info)
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

    owner = graphene.Field(UserNode)
    run = graphene.Field("api_graphql.schema.RunNode")

    @staticmethod
    def resolve_owner(root, info):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        db = get_session(info)
        return UserModel.parse_obj(
            crud_get_user(
                item_to_dict=lambda user: versioned_row_to_dict(user, user.current),
                db=db,
                current_user=current_user,
                user_id=root.created_by,
            ),
        )

    @staticmethod
    def resolve_run(root, info: ResolveInfo):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        # Calculate which top level fields to remove.
        top_level_ignore = {'id', 'run_id', 'created_by', 'created_on', 'updated_by', 'updated_on'}

        select_args = []
        top_level = set()
        for result in graphql_ast_flatten_field(info.field_asts[0], info.fragments, info.return_type, info.schema):
            result_parts = result.split('.')
            if len(result_parts) > 1 and result_parts[1] not in top_level_ignore:
                top_level.add(result_parts[1])

        jsonb_fields = [
            'id',
            'run_id',
            'created_by',
            'created_on',
            'updated_by',
            'updated_on',
        ]
        select_args = [
            Run.id.label('id'),
            Run.id.label('run_id'),
            Run.created_by.label('created_by'),
            Run.created_on.label('created_on'),
            RunVersion.updated_by.label('updated_by'),
            RunVersion.updated_on.label('updated_on'),
        ]
        for field in top_level:
            jsonb_fields.append(field)
            select_args.append(RunVersion.data[field].label(field))

        db = get_session(info)
        row_version = db.query(*select_args)\
            .select_from(RunVersion)\
            .join(Run, Run.id == RunVersion.run_id)\
            .filter(RunVersion.id == root.run_version_id)\
            .first()
        return RunModel.parse_obj(row_version._asdict())

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
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        db = get_session(info)
        return UserModel.parse_obj(
            crud_get_user(
                item_to_dict=lambda user: versioned_row_to_dict(user, user.current),
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

    protocol = graphene.Field(ProtocolNode)
    owner = graphene.Field(UserNode)
    samples = relay.ConnectionField(SampleConnection)

    @staticmethod
    def resolve_protocol(root, info):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        # Calculate which top level fields to remove.
        top_level_ignore = {'id', 'protocol_id', 'created_by', 'created_on', 'updated_by', 'updated_on'}

        select_args = []
        top_level = set()
        for result in graphql_ast_flatten_field(info.field_asts[0], info.fragments, info.return_type, info.schema):
            result_parts = result.split('.')
            if len(result_parts) > 1 and result_parts[1] not in top_level_ignore:
                top_level.add(result_parts[1])

        jsonb_fields = [
            'id',
            'protocol_id',
            'created_by',
            'created_on',
            'updated_by',
            'updated_on',
        ]
        select_args = [
            Protocol.id.label('id'),
            Protocol.id.label('protocol_id'),
            Protocol.created_by.label('created_by'),
            Protocol.created_on.label('created_on'),
            ProtocolVersion.updated_by.label('updated_by'),
            ProtocolVersion.updated_on.label('updated_on'),
        ]
        for field in top_level:
            jsonb_fields.append(field)
            select_args.append(ProtocolVersion.data[field].label(field))

        db = get_session(info)
        row_version = db.query(*select_args)\
            .select_from(ProtocolVersion)\
            .join(Run, and_(
                Run.id == root.id,
                Run.protocol_version_id == ProtocolVersion.id,
            ))\
            .join(Protocol, Protocol.id == ProtocolVersion.protocol_id)\
            .first()
        return ProtocolModel.parse_obj(row_version._asdict())

    @staticmethod
    def resolve_owner(root, info):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        db = get_session(info)
        return UserModel.parse_obj(
            crud_get_user(
                item_to_dict=lambda user: add_ids(versioned_row_to_dict(user, user.current), user_id=user.id),
                db=db,
                current_user=current_user,
                user_id=root.created_by,
            ),
        )

    @staticmethod
    def resolve_samples(
        root,
        info: ResolveInfo,

        # Paging parameters
        page: Optional[int] = None,
        per_page: Optional[int] = None,
    ):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        db = get_session(info)
        pagination_dict = crud_get_run_samples(
            item_to_dict=lambda sample: versioned_row_to_dict(sample, sample.current),
            
            db=db,
            current_user=current_user,

            run_id=root.run_id,

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


class Query(graphene.ObjectType):
    node = relay.Node.Field()

    protocol = relay.Node.Field(
        ProtocolNode,
        version_id=graphene.Int(required=False),
    )
    all_protocols = relay.ConnectionField(
        ProtocolConnection,

        # Search parameters
        protocol=graphene.Int(required=False),
        run=graphene.Int(required=False),
        plate=graphene.String(required=False),
        reagent=graphene.String(required=False),
        sample=graphene.String(required=False),
        creator=graphene.String(required=False),
        archived=graphene.Boolean(required=False),

        # Paging parameters
        page=graphene.Int(required=False),
        per_page=graphene.Int(required=False),
    )
    run = relay.Node.Field(
        RunNode,
        version_id=graphene.Int(required=False),
    )
    all_runs = relay.ConnectionField(
        RunConnection,

        # Search parameters
        protocol=graphene.Int(required=False),
        run=graphene.Int(required=False),
        plate=graphene.String(required=False),
        reagent=graphene.String(required=False),
        sample=graphene.String(required=False),
        creator=graphene.String(required=False),
        archived=graphene.Boolean(required=False),

        # Paging parameters
        page=graphene.Int(required=False),
        per_page=graphene.Int(required=False),
    )
    user = relay.Node.Field(
        UserNode,
        version_id=graphene.Int(required=False),
    )
    all_users = relay.ConnectionField(
        UserConnection,

        # Search parameters
        archived=graphene.Boolean(required=False),

        # Paging parameters
        page=graphene.Int(required=False),
        per_page=graphene.Int(required=False),
    )
    sample = relay.Node.Field(
        SampleNode,
        version_id=graphene.Int(required=False),
    )
    all_samples = relay.ConnectionField(
        SampleConnection,

        # Search parameters
        protocol=graphene.Int(required=False),
        run=graphene.Int(required=False),
        plate=graphene.String(required=False),
        reagent=graphene.String(required=False),
        sample=graphene.String(required=False),
        creator=graphene.String(required=False),
        archived=graphene.Boolean(required=False),

        # Paging parameters
        page=graphene.Int(required=False),
        per_page=graphene.Int(required=False),
    )

    @staticmethod
    def resolve_protocol(root, info: ResolveInfo, id: int, version_id: Optional[int]):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        db = get_session(info)
        model_dict = crud_get_protocol(
            item_to_dict=lambda protocol: add_ids(versioned_row_to_dict(protocol, protocol.current), protocol_id=protocol.id),

            db=db,
            current_user=current_user,

            protocol_id=id,
            version_id=version_id,
        )
        return ProtocolModel.parse_obj(model_dict)

    @staticmethod
    def resolve_all_protocols(
        root,
        info: ResolveInfo,

        # Search parameters
        run: Optional[int] = None,
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

        pagination_dict = graphql_crud_get_protocols(
            current_user,
            info,
            protocol,
            run,
            plate,
            reagent,
            sample,
            creator,
            archived,
            page,
            per_page,
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
        info: ResolveInfo,
        
        id: int,
        version_id: int,
    ):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        db = get_session(info)
        model_dict = crud_get_run(
            item_to_dict=lambda run: add_ids(versioned_row_to_dict(run, run.current), run_id=run.id),

            db=db,
            current_user=current_user,

            run_id=id,
            version_id=version_id,
        )
        return RunModel.parse_obj(model_dict)

    @staticmethod
    def resolve_all_runs(
        root,
        info: ResolveInfo,

        # Search parameters
        protocol: Optional[int] = None,
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

        pagination_dict = graphql_crud_get_runs(
            current_user,
            info,
            protocol,
            run,
            plate,
            reagent,
            sample,
            creator,
            archived,
            page,
            per_page,
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
    def resolve_user(root, info: ResolveInfo, id: str, version_id: Optional[int]):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        db = get_session(info)
        model_dict = crud_get_user(
            item_to_dict=lambda user: add_ids(versioned_row_to_dict(user, user.current), user_id=user.id),

            db=db,
            current_user=current_user,

            user_id=id,
            version_id=version_id,
        )
        return UserModel.parse_obj(model_dict)

    @staticmethod
    def resolve_all_users(
        root,
        info: ResolveInfo,

        # Search parameters
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

        db = get_session(info)
        pagination_dict = crud_get_users(
            item_to_dict=lambda user: add_ids(versioned_row_to_dict(user, user.current), user_id=user.id),

            db=db,
            current_user=current_user,

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
    def resolve_sample(root, info: ResolveInfo, sample_id: str, plate_id: str, run_version_id: int, protocol_version_id: int, version_id: Optional[int]):
        current_user = get_current_user_from_request(info.context['request'])
        if current_user is None:
            raise HTTPException(401, "Unauthorized")

        db = get_session(info)
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
    def resolve_all_samples(
        root,
        info: ResolveInfo,

        # Search params
        protocol: Optional[int] = None,
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

        pagination_dict = graphql_crud_get_samples(
            current_user,
            info,
            protocol,
            run,
            plate,
            reagent,
            sample,
            creator,
            archived,
            page,
            per_page,
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


# TODO:
# - Fix search filters


schema = graphene.Schema(query=Query)
