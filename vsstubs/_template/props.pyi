from collections.abc import Callable, Iterator, MutableMapping
from typing import Any, Literal, overload

from ._typing import _VSValue
from .frames import AudioFrame, RawFrame, VideoFrame
from .nodes import AudioNode, RawNode, VideoNode

type _PropValue = (
    int
    | float
    | str
    | bytes
    | RawFrame
    | VideoFrame
    | AudioFrame
    | RawNode
    | VideoNode
    | AudioNode
    | Callable[..., Any]
    | list[int]
    | list[float]
    | list[str]
    | list[bytes]
    | list[RawFrame]
    | list[VideoFrame]
    | list[AudioFrame]
    | list[RawNode]
    | list[VideoNode]
    | list[AudioNode]
    | list[Callable[..., Any]]
)

# Only the _PropValue types are allowed in FrameProps but passing _VSValue is allowed.
# Just keep in mind that _SupportsIter and _GetItemIterable will only yield their keys if they're Mapping-like.
# Consider storing Mapping-likes as two separate props. One for the keys and one for the values as list.
class FrameProps(MutableMapping[str, _PropValue]):
    def __repr__(self) -> str: ...
    def __dir__(self) -> list[str]: ...
    @overload
    def __getitem__(
        self,
        name: Literal[
            "_ChromaLocation",
            "_Range",
            "_Primaries",
            "_Matrix",
            "_Transfer",
            "_FieldBased",
            "_DurationNum",
            "_DurationDen",
            "_Combed",
            "_Field",
            "_SARNum",
            "_SARDen",
            "_SceneChangeNext",
            "_SceneChangePrev",
        ],
    ) -> int: ...
    @overload
    def __getitem__(self, name: Literal["_AbsoluteTime"]) -> float: ...
    @overload
    def __getitem__(self, name: Literal["_PictType"]) -> bytes: ...
    @overload
    def __getitem__(self, name: Literal["_Alpha"]) -> VideoFrame: ...
    @overload
    def __getitem__(self, name: str) -> _PropValue: ...
    def __setitem__(self, name: str, value: _VSValue) -> None: ...
    def __delitem__(self, name: str) -> None: ...
    def __iter__(self) -> Iterator[str]: ...
    def __len__(self) -> int: ...
    def __setattr__(self, name: str, value: _VSValue) -> None: ...
    def __delattr__(self, name: str) -> None: ...
    def __getattr__(self, name: str) -> _PropValue: ...
    @overload
    def setdefault(self, key: str, default: Literal[0] = 0, /) -> _PropValue | Literal[0]: ...
    @overload
    def setdefault(self, key: str, default: _VSValue, /) -> _PropValue: ...  # pyright: ignore[reportIncompatibleMethodOverride]
    def copy(self) -> dict[str, _PropValue]: ...
    @overload  # type: ignore[override]
    def get(
        self,
        key: Literal[
            "_ChromaLocation",
            "_Range",
            "_Primaries",
            "_Matrix",
            "_Transfer",
            "_FieldBased",
            "_DurationNum",
            "_DurationDen",
            "_Combed",
            "_Field",
            "_SARNum",
            "_SARDen",
            "_SceneChangeNext",
            "_SceneChangePrev",
        ],
        /,
    ) -> int | None: ...
    @overload
    def get[T](
        self,
        key: Literal[
            "_ChromaLocation",
            "_Range",
            "_Primaries",
            "_Matrix",
            "_Transfer",
            "_FieldBased",
            "_DurationNum",
            "_DurationDen",
            "_Combed",
            "_Field",
            "_SARNum",
            "_SARDen",
            "_SceneChangeNext",
            "_SceneChangePrev",
        ],
        default: T,
        /,
    ) -> int | T: ...
    @overload
    def get(self, key: Literal["_AbsoluteTime"], /) -> float | None: ...
    @overload
    def get[T](self, key: Literal["_AbsoluteTime"], default: T, /) -> float | T: ...
    @overload
    def get(self, key: Literal["_PictType"], /) -> bytes | None: ...
    @overload
    def get[T](self, key: Literal["_PictType"], default: T, /) -> bytes | T: ...
    @overload
    def get(self, key: Literal["_Alpha"], /) -> VideoFrame | None: ...
    @overload
    def get[T](self, key: Literal["_Alpha"], default: T, /) -> VideoFrame | T: ...
    @overload
    def get(self, key: str, /) -> _PropValue | None: ...
    @overload
    def get[T](self, key: str, default: T, /) -> _PropValue | T: ...  # pyright: ignore[reportIncompatibleMethodOverride]
