from typing import Any, List, Optional, Union
from typing_extensions import Literal
from pydantic import BaseModel, Field, constr


class JsonPointer(BaseModel):
    __root__: constr(regex='^(/[^/~]*(~[01][^/~]*)*)*$')


class Add(BaseModel):
    op: Literal['add'] = 'add'
    path: JsonPointer


class Remove(BaseModel):
    op: Literal['remove'] = 'remove'
    path: JsonPointer


class Replace(BaseModel):
    op: Literal['replace'] = 'replace'
    path: JsonPointer


class Move(BaseModel):
    op: Literal['move'] = 'move'
    from_: JsonPointer = Field(..., alias='from')
    path: JsonPointer


class Copy(BaseModel):
    op: Literal['copy'] = 'copy'
    from_: JsonPointer = Field(..., alias='from')
    path: JsonPointer


class Test(BaseModel):
    op: Literal['test'] = 'test'
    path: JsonPointer


OneOperation = Union[
    Add,
    Remove,
    Replace,
    Move,
    Copy,
    Test,
]


JSONPatch = List[OneOperation]
