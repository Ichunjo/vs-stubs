from collections.abc import Buffer
from typing import Any, Callable, Iterable, Iterator, Mapping, Protocol, SupportsFloat, SupportsIndex, SupportsInt

from .frames import AudioFrame, RawFrame, VideoFrame
from .nodes import AudioNode, RawNode, VideoNode

type _AnyStr = str | bytes | bytearray
type _IntLike = SupportsInt | SupportsIndex | Buffer
type _FloatLike = SupportsFloat | SupportsIndex | Buffer

type _VSValueSingle = (
    int | float | _AnyStr | RawFrame | VideoFrame | AudioFrame | RawNode | VideoNode | AudioNode | Callable[..., Any]
)

type _VSValueIterable = (
    _SupportsIter[_IntLike]
    | _SupportsIter[_FloatLike]
    | _SupportsIter[_AnyStr]
    | _SupportsIter[RawFrame]
    | _SupportsIter[VideoFrame]
    | _SupportsIter[AudioFrame]
    | _SupportsIter[RawNode]
    | _SupportsIter[VideoNode]
    | _SupportsIter[AudioNode]
    | _SupportsIter[Callable[..., Any]]
    | _GetItemIterable[_IntLike]
    | _GetItemIterable[_FloatLike]
    | _GetItemIterable[_AnyStr]
    | _GetItemIterable[RawFrame]
    | _GetItemIterable[VideoFrame]
    | _GetItemIterable[AudioFrame]
    | _GetItemIterable[RawNode]
    | _GetItemIterable[VideoNode]
    | _GetItemIterable[AudioNode]
    | _GetItemIterable[Callable[..., Any]]
)
type _VSValue = _VSValueSingle | _VSValueIterable

class _SupportsIter[_T](Protocol):
    def __iter__(self) -> Iterator[_T]: ...

class _SequenceLike[_T](Protocol):
    def __iter__(self) -> Iterator[_T]: ...
    def __len__(self) -> int: ...

class _GetItemIterable[_T](Protocol):
    def __getitem__(self, i: SupportsIndex, /) -> _T: ...

class _SupportsKeysAndGetItem[_KT, _VT](Protocol):
    def __getitem__(self, key: _KT, /) -> _VT: ...
    def keys(self) -> Iterable[_KT]: ...

class _VSCallback(Protocol):
    def __call__(self, *args: Any, **kwargs: Any) -> _VSValue: ...

# Known callback signatures
# _VSCallback_{plugin_namespace}_{Function_name}_{parameter_name}
class _VSCallback_akarin_PropExpr_dict(Protocol):
    def __call__(
        self,
    ) -> Mapping[
        str,
        _IntLike
        | _FloatLike
        | _AnyStr
        | _SupportsIter[_IntLike]
        | _SupportsIter[_AnyStr]
        | _SupportsIter[_FloatLike]
        | _GetItemIterable[_IntLike]
        | _GetItemIterable[_FloatLike]
        | _GetItemIterable[_AnyStr],
    ]: ...

class _VSCallback_descale_Decustom_custom_kernel(Protocol):
    def __call__(self, *, x: float) -> _FloatLike: ...

class _VSCallback_descale_ScaleCustom_custom_kernel(Protocol):
    def __call__(self, *, x: float) -> _FloatLike: ...

class _VSCallback_std_FrameEval_eval_0(Protocol):
    def __call__(self, *, n: int) -> VideoNode: ...

class _VSCallback_std_FrameEval_eval_1(Protocol):
    def __call__(self, *, n: int, f: VideoFrame) -> VideoNode: ...

class _VSCallback_std_FrameEval_eval_2(Protocol):
    def __call__(self, *, n: int, f: list[VideoFrame]) -> VideoNode: ...

class _VSCallback_std_FrameEval_eval_3(Protocol):
    def __call__(self, *, n: int, f: VideoFrame | list[VideoFrame]) -> VideoNode: ...

type _VSCallback_std_FrameEval_eval = (  # noqa: PYI047
    _VSCallback_std_FrameEval_eval_0
    | _VSCallback_std_FrameEval_eval_1
    | _VSCallback_std_FrameEval_eval_2
    | _VSCallback_std_FrameEval_eval_3
)

class _VSCallback_std_Lut_function_0(Protocol):
    def __call__(self, *, x: int) -> _IntLike: ...

class _VSCallback_std_Lut_function_1(Protocol):
    def __call__(self, *, x: float) -> _FloatLike: ...

type _VSCallback_std_Lut_function = _VSCallback_std_Lut_function_0 | _VSCallback_std_Lut_function_1  # noqa: PYI047

class _VSCallback_std_Lut2_function_0(Protocol):
    def __call__(self, *, x: int, y: int) -> _IntLike: ...

class _VSCallback_std_Lut2_function_1(Protocol):
    def __call__(self, *, x: float, y: float) -> _FloatLike: ...

type _VSCallback_std_Lut2_function = _VSCallback_std_Lut2_function_0 | _VSCallback_std_Lut2_function_1  # noqa: PYI047

class _VSCallback_std_ModifyFrame_selector_0(Protocol):
    def __call__(self, *, n: int, f: VideoFrame) -> VideoFrame: ...

class _VSCallback_std_ModifyFrame_selector_1(Protocol):
    def __call__(self, *, n: int, f: list[VideoFrame]) -> VideoFrame: ...

class _VSCallback_std_ModifyFrame_selector_2(Protocol):
    def __call__(self, *, n: int, f: VideoFrame | list[VideoFrame]) -> VideoFrame: ...

type _VSCallback_std_ModifyFrame_selector = (  # noqa: PYI047
    _VSCallback_std_ModifyFrame_selector_0
    | _VSCallback_std_ModifyFrame_selector_1
    | _VSCallback_std_ModifyFrame_selector_2
)

class _VSCallback_resize2_Custom_custom_kernel(Protocol):
    def __call__(self, *, x: float) -> _FloatLike: ...
