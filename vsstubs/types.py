from __future__ import annotations

from collections.abc import Callable as abc_Callable
from collections.abc import Sequence as abc_Sequence
from ctypes import Union as ctypes_Union
from functools import cache
from inspect import Signature
from types import GenericAlias, NoneType, UnionType
from typing import (
    Any,
    Mapping,
    NamedTuple,
    Protocol,
    Sequence,
    Union,
    get_args,
    get_origin,
    runtime_checkable,
)

from vapoursynth import AudioNode, Core, VideoNode

from .constants import _ATTR_IMPL_END, _ATTR_IMPL_START, _IMPL_END, _IMPL_START

type _CoreLike = Core | VideoNode | AudioNode  # noqa: PYI047
type _CoreLikeStr = str


class PluginInterface(NamedTuple):
    """Function interface for wrapping vs.Plugin."""

    namespace: str
    functions: Mapping[_CoreLikeStr, Sequence[FunctionInterface]]
    description: str


class FunctionInterface(NamedTuple):
    """Function interface for wrapping vs.Function."""

    name: str
    signature: Signature


class Attribute(NamedTuple):
    """Attribute interfarce."""

    name: str
    core_name: _CoreLikeStr
    doc: str

    def as_stub(self) -> str:
        return (
            f"{_ATTR_IMPL_START.format(core_name=self.core_name, name=self.name)}\n"
            f"    {self.name}: Final[_{self.name}._{self.core_name}_bound.Plugin]\n"
            f'    """{self.doc}"""\n'
            f"{_ATTR_IMPL_END.format(core_name=self.core_name, name=self.name)}\n"
        )


class Implementation(NamedTuple):
    namespace: str
    functions: Mapping[_CoreLikeStr, Sequence[str]]
    description: str
    extra_types: Sequence[str] | None = None

    def as_stub(self) -> str:
        indent = " " * 4
        stub = [_IMPL_START.format(name=self.namespace)]

        if self.extra_types:
            stub.append("\n".join(self.extra_types))
            stub[-1] = stub[-1] + "\n"

        stub.append(f"class _{self.namespace}:")

        for core_name, funcs in self.functions.items():
            stub.append(indent + f"class _{core_name}_bound:")
            stub.append(indent * 2 + "class Plugin(_VSPlugin):")

            for func in funcs:
                stub.append(indent * 3 + "@_Wrapper.Function")
                stub.append(indent * 3 + func)
            else:
                stub[-1] = stub[-1] + "\n"

        stub.append(_IMPL_END.format(name=self.namespace))

        return "\n".join(stub) + "\n"


class TypeLike:
    __slots__ = ()

    @property
    def __name__(self) -> str:
        return self.__repr__()


class UnionLike(TypeLike):
    """Union-like type to represent Union types with the modern | operator."""

    __slots__ = ("_args",)

    def __init__(self, args: Sequence[Any]) -> None:
        self._args = args

    def __repr__(self) -> str:
        repr_types = list[str]()

        for t in self._args:
            if t is NoneType:
                repr_types.append("None")
            elif isinstance(t, type):
                repr_types.append(t.__name__)
            elif isinstance(t, GenericAlias):
                parameters = ", ".join(ta.__name__ for ta in t.__args__)
                repr_types.append(t.__origin__.__name__ + f"[{parameters}]")
            else:
                repr_types.append(repr(t))

        return " | ".join(repr_types)


class VSCallbackTypeLike(TypeLike):
    """Type-like to represent a VSCallback."""

    __slots__ = "repr"

    def __init__(self, repr: str) -> None:
        self.repr = repr

    def __repr__(self) -> str:
        return self.repr


class SequenceLike(TypeLike):
    __slots__ = ("_args", "repr")

    def __init__(self, args: Sequence[Any]) -> None:
        self._args = args
        self.repr = "_SequenceLike"

    def __repr__(self) -> str:
        return self.repr + "[" + ", ".join(ta.__name__ for ta in self._args) + "]"


@cache
def parse_type(utype: Any, is_return: bool = False) -> Any:
    if (origin := get_origin(utype)) is None:
        return utype

    parsed = tuple(parse_type(arg, is_return) for arg in get_args(utype))

    if isinstance(origin, UnionType) or origin is ctypes_Union or origin is Union:
        return UnionLike(parsed)

    if origin is abc_Sequence:
        if is_return:
            return GenericAlias(list, parsed)
        return SequenceLike(parsed)

    if origin is abc_Callable:
        return VSCallbackTypeLike("_VSCallback")

    return GenericAlias(origin, parsed)


@runtime_checkable
class HasNameSpace(Protocol):
    @property
    def namespace(self) -> str: ...
