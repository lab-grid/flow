from collections import OrderedDict
from typing import Dict, List, Optional, Set
from graphql.execution.base import ResolveInfo
from graphql.language.ast import Field, FragmentDefinition, FragmentSpread
from graphql.type.definition import GraphQLList, GraphQLNonNull
from graphql.type.schema import GraphQLSchema
from database import Protocol, ProtocolVersion, Run, RunVersion, Sample, SampleVersion, filter_by_plate_label_filter, filter_by_reagent_label_filter, filter_by_sample_label_filter
from fastapi import Request
from models import ProtocolModel, RunModel, SampleResult
from server import Auth0CurrentUserPatched, Session

from api.utils import paginatify
from authorization import check_access

# CRUD helpers ----------------------------------------------------------------

def get_session(info: ResolveInfo) -> Session:
    return getattr(info.context['request'].state, 'session', None)

def get_current_user_from_request(request: Request) -> Auth0CurrentUserPatched:
    return getattr(request.state, 'user', None)

def change_case(orig: str) -> str:
    return ''\
        .join(['_' + i.lower() if i.isupper() else i for i in orig])\
        .lstrip('_')

def graphql_ast_get_subfield(schema, sub_field: str):
    return schema.fields.get(sub_field).type

def graphql_ast_flatten_field(field: Field, fragments: Dict[str, FragmentDefinition], schema, root_schema: GraphQLSchema) -> List[str]:
    results = []
    # is_list = isinstance(schema, GraphQLList)
    list_count = 0
    while True:
        schema_changed = False
        if isinstance(schema, GraphQLNonNull):
            schema = schema.of_type
            schema_changed = True
        if isinstance(schema, GraphQLList):
            list_count += 1
            schema = schema.of_type
            schema_changed = True
        if not schema_changed:
            break
    if getattr(field, 'selection_set', None) is not None:
        for sub_field in field.selection_set.selections:
            if isinstance(sub_field, FragmentSpread):
                sub_field = fragments[sub_field.name.value]
                sub_field_schema = schema
            else:
                sub_field_schema = graphql_ast_get_subfield(schema, sub_field.name.value)
                if type(sub_field_schema) == str:
                    sub_field_schema = root_schema.get_type(sub_field_schema)
            sub_field_results = graphql_ast_flatten_field(sub_field, fragments, sub_field_schema, root_schema)
            if isinstance(field, FragmentDefinition):
                results += sub_field_results
            else:
                for result in sub_field_results:
                    results.append(f"{change_case(field.name.value)}{'[*]' * list_count}.{result}")
    else:
        results.append(change_case(field.name.value))
    return results

def graphql_ast_get_sub_fields(field: Field, fragments: Dict[str, FragmentDefinition]) -> Set[str]:
    sub_fields = set()
    if getattr(field, 'selection_set', None) is not None:
        for sub_field in field.selection_set.selections:
            if isinstance(sub_field, FragmentSpread):
                sub_fields.update(graphql_ast_get_sub_fields(fragments[sub_field.name.value], fragments))
            else:
                sub_fields.add(sub_field.name.value)
    return sub_fields

def graphql_ast_schema_fields(schema) -> Set[str]:
    return schema.fields.keys()


# CRUD methods ----------------------------------------------------------------

def graphql_crud_get_runs(
    current_user: Auth0CurrentUserPatched,
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
):
    # Calculate which top level fields to remove.
    top_level_ignore = {'id', 'run_id', 'created_by', 'created_on', 'updated_by', 'updated_on', 'protocol'}

    # Flatten `info` parameter into jsonb_query_path statements.
    select_args = []
    top_level = set()
    for result in graphql_ast_flatten_field(info.field_asts[0], info.fragments, info.return_type, info.schema):
        result_parts = result.split('.')
        if len(result_parts) > 3 and result_parts[3] not in top_level_ignore:
            top_level.add(result_parts[3])
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
        # func.jsonb_path_query(RunVersion.data, f"$.{field}").label(field)
        jsonb_fields.append(field)
        select_args.append(RunVersion.data[field].label(field))

    db = get_session(info)

    # Join with additional tables as necessary for search params.
    from_tables = OrderedDict()
    filters = []
    
    if protocol:
        from_tables[ProtocolVersion] = ProtocolVersion.id == Run.protocol_version_id
        filters.append(ProtocolVersion.protocol_id == protocol)
    if run:
        filters.append(Run.id == run)
    if plate:
        filters.append(filter_by_plate_label_filter(plate))
    if reagent:
        filters.append(filter_by_reagent_label_filter(reagent))
    if sample:
        filters.append(filter_by_sample_label_filter(reagent))
    if creator:
        filters.append(Run.created_by == creator)
    if archived is None or archived == False:
        filters.append(Run.is_deleted == False)

    query = db.query(*select_args)\
        .select_from(Run)\
        .join(RunVersion, RunVersion.id == Run.version_id)
    for join_cls, join_filter in from_tables.values():
        query = query.join(join_cls, join_filter)
    
    # Apply search filters.
    for search_filter in filters:
        query = query.filter(search_filter)

    # Get results
    query = query.distinct().order_by(Run.created_on.desc())
    rows = [
        run
        for run
        in query
        if check_access(user=current_user.username, path=f"/run/{str(run.id)}", method="GET")
    ]

    return paginatify(
        items_label='runs',
        items=rows,
        item_to_dict=lambda run: RunModel.parse_obj(run._asdict()),
        page=page,
        per_page=per_page,
    )

def graphql_crud_get_protocols(
    current_user: Auth0CurrentUserPatched,
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
):
    # Calculate which top level fields to remove.
    top_level_ignore = {'id', 'protocol_id', 'created_by', 'created_on', 'updated_by', 'updated_on', 'protocol'}

    # Flatten `info` parameter into jsonb_query_path statements.
    select_args = []
    top_level = set()
    for result in graphql_ast_flatten_field(info.field_asts[0], info.fragments, info.return_type, info.schema):
        result_parts = result.split('.')
        if len(result_parts) > 3 and result_parts[3] not in top_level_ignore:
            top_level.add(result_parts[3])
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

    # Join with additional tables as necessary for search params.
    from_tables = OrderedDict()
    filters = []
    
    if protocol:
        filters.append(Protocol.id == protocol)
    if run:
        from_tables[Run] = Run.protocol_version_id == ProtocolVersion.id
        filters.append(Run.id == run)
    if plate:
        from_tables[Run] = Run.protocol_version_id == ProtocolVersion.id
        from_tables[RunVersion] = RunVersion.id == Run.version_id
        filters.append(filter_by_plate_label_filter(plate))
    if reagent:
        from_tables[Run] = Run.protocol_version_id == ProtocolVersion.id
        from_tables[RunVersion] = RunVersion.id == Run.version_id
        filters.append(filter_by_reagent_label_filter(reagent))
    if sample:
        from_tables[Run] = Run.protocol_version_id == ProtocolVersion.id
        from_tables[RunVersion] = RunVersion.id == Run.version_id
        filters.append(filter_by_sample_label_filter(reagent))
    if creator:
        filters.append(Protocol.created_by == creator)
    if archived is None or archived == False:
        filters.append(Protocol.is_deleted == False)

    query = db.query(*select_args)\
        .select_from(Protocol)\
        .join(ProtocolVersion, ProtocolVersion.id == Protocol.version_id)
    for join_cls, join_filter in from_tables.items():
        query = query.join(join_cls, join_filter)
    
    # Apply search filters.
    for search_filter in filters:
        query = query.filter(search_filter)

    # Get results
    query = query.distinct().order_by(Protocol.created_on.desc())
    rows = [
        protocol
        for protocol
        in query
        if check_access(user=current_user.username, path=f"/protocol/{str(protocol.id)}", method="GET")
    ]

    return paginatify(
        items_label='protocols',
        items=rows,
        item_to_dict=lambda protocol: ProtocolModel.parse_obj(protocol._asdict()),
        page=page,
        per_page=per_page,
    )

def graphql_crud_get_samples(
    current_user: Auth0CurrentUserPatched,
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
):
    # Calculate which top level fields to remove.
    top_level_ignore = {'sample_id', 'plate_id', 'run_version_id', 'protocol_version_id', 'created_by', 'created_on', 'updated_by', 'updated_on', 'run_id', 'protocol_id'}

    # Flatten `info` parameter into jsonb_query_path statements.
    select_args = []
    top_level = set()
    for result in graphql_ast_flatten_field(info.field_asts[0], info.fragments, info.return_type, info.schema):
        result_parts = result.split('.')
        if len(result_parts) > 3 and result_parts[3] not in top_level_ignore:
            top_level.add(result_parts[3])
    jsonb_fields = [
        'sampleID',
        'sample_id',
        'plateID',
        'plate_id',
        'run_version_id',
        'protocol_version_id',
        'created_by',
        'created_on',
        'updated_by',
        'updated_on',
        'run_id',
        'runID',
        'protocol_id',
        'protocolID',
    ]
    select_args = [
        Sample.sample_id.label('sample_id'),
        Sample.sample_id.label('sampleID'),
        Sample.plate_id.label('plate_id'),
        Sample.plate_id.label('plateID'),
        Sample.run_version_id.label('run_version_id'),
        Sample.protocol_version_id.label('protocol_version_id'),
        Sample.created_by.label('created_by'),
        Sample.created_on.label('created_on'),
        SampleVersion.updated_by.label('updated_by'),
        SampleVersion.updated_on.label('updated_on'),
        RunVersion.run_id.label('run_id'),
        RunVersion.run_id.label('runID'),
        ProtocolVersion.protocol_id.label('protocol_id'),
        ProtocolVersion.protocol_id.label('protocolID'),
    ]
    for field in top_level:
        jsonb_fields.append(field)
        select_args.append(SampleVersion.data[field].label(field))

    db = get_session(info)

    # Join with additional tables as necessary for search params.
    from_tables = OrderedDict()
    filters = []
    
    if protocol:
        filters.append(ProtocolVersion.protocol_id == protocol)
    if run:
        filters.append(RunVersion.run_id == run)
    if plate:
        filters.append(Sample.plate_id == plate)
    if reagent:
        filters.append(filter_by_reagent_label_filter(reagent))
    if sample:
        filters.append(Sample.sample_id == sample)
    if creator:
        filters.append(Sample.created_by == creator)
    if archived is None or archived == False:
        filters.append(Sample.is_deleted == False)

    query = db.query(*select_args)\
        .select_from(Sample)\
        .join(SampleVersion, SampleVersion.id == Sample.version_id)\
        .join(RunVersion, RunVersion.id == Sample.run_version_id)\
        .join(ProtocolVersion, ProtocolVersion.id == Sample.protocol_version_id)
    for join_cls, join_filter in from_tables.items():
        query = query.join(join_cls, join_filter)
    
    # Apply search filters.
    for search_filter in filters:
        query = query.filter(search_filter)

    # Get results
    query = query.distinct().order_by(Sample.created_on.desc())
    rows = [
        sample
        for sample
        in query
        if check_access(user=current_user.username, path=f"/run/{str(sample.run_id)}", method="GET")
    ]

    return paginatify(
        items_label='samples',
        items=rows,
        item_to_dict=lambda sample: SampleResult.parse_obj(sample._asdict()),
        page=page,
        per_page=per_page,
    )
