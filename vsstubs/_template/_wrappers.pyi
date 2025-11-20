from typing import Callable, Concatenate, overload

from ._typing import (
    _SequenceLike,
    _VSCallback_std_FrameEval_eval,
    _VSCallback_std_FrameEval_eval_0,
    _VSCallback_std_FrameEval_eval_1,
    _VSCallback_std_FrameEval_eval_2,
    _VSCallback_std_FrameEval_eval_3,
    _VSCallback_std_ModifyFrame_selector,
    _VSCallback_std_ModifyFrame_selector_0,
    _VSCallback_std_ModifyFrame_selector_1,
)
from .nodes import VideoNode
from .plugin import Function, Plugin

_VSPlugin = Plugin
_VSFunction = Function

class _Wrapper:
    class Function[**_P, _R](_VSFunction):
        def __init__[_PluginT: Plugin](self, function: Callable[Concatenate[_PluginT, _P], _R]) -> None: ...
        def __call__(self, *args: _P.args, **kwargs: _P.kwargs) -> _R: ...

class _Wrapper_Core_bound_FrameEval:
    class Function(_VSFunction):
        def __init__[_PluginT: Plugin](self, function: Callable[Concatenate[_PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            clip: VideoNode,
            eval: _VSCallback_std_FrameEval_eval_0,
            prop_src: None = None,
            clip_src: VideoNode | _SequenceLike[VideoNode] | None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            clip: VideoNode,
            eval: _VSCallback_std_FrameEval_eval_1,
            prop_src: VideoNode,
            clip_src: VideoNode | _SequenceLike[VideoNode] | None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            clip: VideoNode,
            eval: _VSCallback_std_FrameEval_eval_2,
            prop_src: _SequenceLike[VideoNode],
            clip_src: VideoNode | _SequenceLike[VideoNode] | None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            clip: VideoNode,
            eval: _VSCallback_std_FrameEval_eval_3,
            prop_src: VideoNode | _SequenceLike[VideoNode],
            clip_src: VideoNode | _SequenceLike[VideoNode] | None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            clip: VideoNode,
            eval: _VSCallback_std_FrameEval_eval,
            prop_src: VideoNode | _SequenceLike[VideoNode] | None,
            clip_src: VideoNode | _SequenceLike[VideoNode] | None = None,
        ) -> VideoNode: ...

class _Wrapper_VideoNode_bound_FrameEval:
    class Function(_VSFunction):
        def __init__[_PluginT: Plugin](self, function: Callable[Concatenate[_PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            eval: _VSCallback_std_FrameEval_eval_0,
            prop_src: None = None,
            clip_src: VideoNode | _SequenceLike[VideoNode] | None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            eval: _VSCallback_std_FrameEval_eval_1,
            prop_src: VideoNode,
            clip_src: VideoNode | _SequenceLike[VideoNode] | None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            eval: _VSCallback_std_FrameEval_eval_2,
            prop_src: _SequenceLike[VideoNode],
            clip_src: VideoNode | _SequenceLike[VideoNode] | None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            eval: _VSCallback_std_FrameEval_eval_3,
            prop_src: VideoNode | _SequenceLike[VideoNode],
            clip_src: VideoNode | _SequenceLike[VideoNode] | None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            eval: _VSCallback_std_FrameEval_eval,
            prop_src: VideoNode | _SequenceLike[VideoNode] | None,
            clip_src: VideoNode | _SequenceLike[VideoNode] | None = None,
        ) -> VideoNode: ...

class _Wrapper_Core_bound_ModifyFrame:
    class Function(_VSFunction):
        def __init__[_PluginT: Plugin](self, function: Callable[Concatenate[_PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self, clip: VideoNode, clips: VideoNode, selector: _VSCallback_std_ModifyFrame_selector_0
        ) -> VideoNode: ...
        @overload
        def __call__(
            self, clip: VideoNode, clips: _SequenceLike[VideoNode], selector: _VSCallback_std_ModifyFrame_selector_1
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            clip: VideoNode,
            clips: VideoNode | _SequenceLike[VideoNode],
            selector: _VSCallback_std_ModifyFrame_selector,
        ) -> VideoNode: ...

class _Wrapper_VideoNode_bound_ModifyFrame:
    class Function(_VSFunction):
        def __init__[_PluginT: Plugin](self, function: Callable[Concatenate[_PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(self, clips: VideoNode, selector: _VSCallback_std_ModifyFrame_selector_0) -> VideoNode: ...
        @overload
        def __call__(
            self, clips: _SequenceLike[VideoNode], selector: _VSCallback_std_ModifyFrame_selector_1
        ) -> VideoNode: ...
        @overload
        def __call__(
            self, clips: VideoNode | _SequenceLike[VideoNode], selector: _VSCallback_std_ModifyFrame_selector
        ) -> VideoNode: ...
