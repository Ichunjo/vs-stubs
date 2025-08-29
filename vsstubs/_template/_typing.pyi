from typing import Any, Callable, Iterable, Iterator, Mapping, Protocol, TypeAlias, TypeVar

from .frames import AudioFrame, RawFrame, VideoFrame
from .nodes import AudioNode, RawNode, VideoNode
from .plugin import Plugin

_AnyStr: TypeAlias = str | bytes | bytearray

_VSValueSingle: TypeAlias = (
    int | float | _AnyStr | RawFrame | VideoFrame | AudioFrame | RawNode | VideoNode | AudioNode | Callable[..., Any]
)

_VSValueIterable: TypeAlias = (
    _SupportsIter[int]
    | _SupportsIter[_AnyStr]
    | _SupportsIter[float]
    | _SupportsIter[RawFrame]
    | _SupportsIter[VideoFrame]
    | _SupportsIter[AudioFrame]
    | _SupportsIter[RawNode]
    | _SupportsIter[VideoNode]
    | _SupportsIter[AudioNode]
    | _SupportsIter[Callable[..., Any]]
    | _GetItemIterable[int]
    | _GetItemIterable[float]
    | _GetItemIterable[_AnyStr]
    | _GetItemIterable[RawFrame]
    | _GetItemIterable[VideoFrame]
    | _GetItemIterable[AudioFrame]
    | _GetItemIterable[RawNode]
    | _GetItemIterable[VideoNode]
    | _GetItemIterable[AudioNode]
    | _GetItemIterable[Callable[..., Any]]
)
_VSValue: TypeAlias = _VSValueSingle | _VSValueIterable

_VSPlugin: TypeAlias = Plugin  # noqa: PYI047

_KT = TypeVar("_KT")
_VT_co = TypeVar("_VT_co", covariant=True)
_T_co = TypeVar("_T_co", covariant=True)

class _SupportsIter(Protocol[_T_co]):
    def __iter__(self) -> Iterator[_T_co]: ...

class _SequenceLike(Protocol[_T_co]):
    def __iter__(self) -> Iterator[_T_co]: ...
    def __len__(self) -> int: ...

class _GetItemIterable(Protocol[_T_co]):
    def __getitem__(self, i: int, /) -> _T_co: ...

class _SupportsKeysAndGetItem(Protocol[_KT, _VT_co]):
    def keys(self) -> Iterable[_KT]: ...
    def __getitem__(self, key: _KT, /) -> _VT_co: ...

class _SupportsInt(Protocol):
    def __int__(self) -> int: ...

class _VSCallback(Protocol):
    def __call__(self, *args: Any, **kwargs: Any) -> _VSValue: ...

# Known callback signatures
# _VSCallback_{plugin_namespace}_{Function_name}_{parameter_name}
class _VSCallback_akarin_PropExpr_dict(Protocol):
    def __call__(
        self,
    ) -> Mapping[
        str,
        int
        | float
        | _AnyStr
        | _SupportsIter[int]
        | _SupportsIter[_AnyStr]
        | _SupportsIter[float]
        | _GetItemIterable[int]
        | _GetItemIterable[float]
        | _GetItemIterable[_AnyStr],
    ]: ...

class _VSCallback_descale_Decustom_custom_kernel(Protocol):
    def __call__(self, *, x: float) -> float: ...

class _VSCallback_descale_ScaleCustom_custom_kernel(Protocol):
    def __call__(self, *, x: float) -> float: ...

class _VSCallback_std_FrameEval_eval_0(Protocol):
    def __call__(self, *, n: int) -> VideoNode: ...

class _VSCallback_std_FrameEval_eval_1(Protocol):
    def __call__(self, *, n: int, f: VideoFrame) -> VideoNode: ...

class _VSCallback_std_FrameEval_eval_2(Protocol):
    def __call__(self, *, n: int, f: list[VideoFrame]) -> VideoNode: ...

_VSCallback_std_FrameEval_eval: TypeAlias = (  # noqa: PYI047
    _VSCallback_std_FrameEval_eval_0 | _VSCallback_std_FrameEval_eval_1 | _VSCallback_std_FrameEval_eval_2
)

class _VSCallback_std_Lut_function_0(Protocol):
    def __call__(self, *, x: int) -> int: ...

class _VSCallback_std_Lut_function_1(Protocol):
    def __call__(self, *, x: float) -> float: ...

_VSCallback_std_Lut_function: TypeAlias = _VSCallback_std_Lut_function_0 | _VSCallback_std_Lut_function_1  # noqa: PYI047

class _VSCallback_std_Lut2_function_0(Protocol):
    def __call__(self, *, x: int, y: int) -> int: ...

class _VSCallback_std_Lut2_function_1(Protocol):
    def __call__(self, *, x: float, y: float) -> float: ...

_VSCallback_std_Lut2_function: TypeAlias = _VSCallback_std_Lut2_function_0 | _VSCallback_std_Lut2_function_1  # noqa: PYI047

class _VSCallback_std_ModifyFrame_selector_0(Protocol):
    def __call__(self, *, n: int, f: VideoFrame) -> VideoFrame: ...

class _VSCallback_std_ModifyFrame_selector_1(Protocol):
    def __call__(self, *, n: int, f: list[VideoFrame]) -> VideoFrame: ...

_VSCallback_std_ModifyFrame_selector: TypeAlias = (  # noqa: PYI047
    _VSCallback_std_ModifyFrame_selector_0 | _VSCallback_std_ModifyFrame_selector_1
)

class _VSCallback_resize2_Custom_custom_kernel(Protocol):
    def __call__(self, *, x: float) -> float: ...
