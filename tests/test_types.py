import collections.abc
from collections.abc import Callable
from types import GenericAlias
from typing import Union

from vapoursynth import AudioNode, VideoNode

from vsstubs.types import (
    AnyStr,
    AudioNodeType,
    FloatLike,
    IntLike,
    SequenceLike,
    VideoNodeType,
    VSCallbackTypeLike,
    parse_type,
)


def test_parse_type_basic() -> None:
    assert isinstance(parse_type(int), IntLike)
    assert isinstance(parse_type(float), FloatLike)
    assert isinstance(parse_type(VideoNode), VideoNodeType)
    assert isinstance(parse_type(AudioNode), AudioNodeType)
    assert parse_type(str) is str


def test_parse_type_union() -> None:
    # Union[int, float] -> IntLike | FloatLike
    parsed = parse_type(Union[int, float])  # noqa: UP007
    assert repr(parsed) == "_IntLike | _FloatLike"


def test_parse_type_anystr() -> None:
    # Union[str, bytes, bytearray] -> AnyStr
    parsed = parse_type(Union[str, bytes, bytearray])  # noqa: UP007
    assert isinstance(parsed, AnyStr)
    assert repr(parsed) == "_AnyStr"


def test_parse_type_sequence() -> None:
    # Sequence[int] -> SequenceLike[IntLike]
    parsed = parse_type(collections.abc.Sequence[int])
    assert isinstance(parsed, SequenceLike)
    assert repr(parsed) == "_SequenceLike[_IntLike]"

    # If is_return=True, it should be list[IntLike]
    parsed_ret = parse_type(collections.abc.Sequence[int], is_return=True)
    assert isinstance(parsed_ret, GenericAlias)
    assert parsed_ret.__origin__ is list


def test_parse_type_callable() -> None:
    # Callable[[int], float] -> VSCallbackTypeLike
    parsed = parse_type(Callable[[int], float])
    assert isinstance(parsed, VSCallbackTypeLike)
    assert repr(parsed) == "_VSCallback"


def test_sequence_like_repr() -> None:
    s = SequenceLike([IntLike()])
    assert repr(s) == "_SequenceLike[_IntLike]"
