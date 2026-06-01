from collections.abc import Callable
from typing import Concatenate, TypedDict, overload

from ._typing import (
    _AnyStr,
    _IntLike,
    _SequenceLike,
    _VSCallback_ov_Model_config,
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
    class Function[**P, R](_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, P], R]) -> None: ...
        def __call__(self, *args: P.args, **kwargs: P.kwargs) -> R: ...

class _Wrapper_Core_bound_std_FrameEval:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
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

class _Wrapper_VideoNode_bound_std_FrameEval:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
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

class _Wrapper_Core_bound_std_ModifyFrame:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
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

class _Wrapper_VideoNode_bound_std_ModifyFrame:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
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

class _ReturnDict_ncnn_Model(TypedDict):
    clip: VideoNode
    num_planes: int

class _Wrapper_Core_bound_ncnn_Model:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            flexible_output_prop: None = None,
            output_format: _IntLike | None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            *,
            flexible_output_prop: _AnyStr,
            output_format: _IntLike | None = None,
        ) -> _ReturnDict_ncnn_Model: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            flexible_output_prop: _AnyStr | None = None,
            output_format: _IntLike | None = None,
        ) -> VideoNode | _ReturnDict_ncnn_Model: ...

class _Wrapper_VideoNode_bound_ncnn_Model:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            flexible_output_prop: None = None,
            output_format: _IntLike | None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            *,
            flexible_output_prop: _AnyStr,
            output_format: _IntLike | None = None,
        ) -> _ReturnDict_ncnn_Model: ...
        @overload
        def __call__(
            self,
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            flexible_output_prop: _AnyStr | None = None,
            output_format: _IntLike | None = None,
        ) -> VideoNode | _ReturnDict_ncnn_Model: ...

class _ReturnDict_ort_Model(TypedDict):
    clip: VideoNode
    num_planes: int

class _Wrapper_Core_bound_ort_Model:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            provider: _AnyStr | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            cudnn_benchmark: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            prefer_nhwc: _IntLike | None = None,
            output_format: _IntLike | None = None,
            tf32: _IntLike | None = None,
            flexible_output_prop: None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            provider: _AnyStr | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            cudnn_benchmark: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            prefer_nhwc: _IntLike | None = None,
            output_format: _IntLike | None = None,
            tf32: _IntLike | None = None,
            *,
            flexible_output_prop: _AnyStr,
        ) -> _ReturnDict_ort_Model: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            provider: _AnyStr | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            cudnn_benchmark: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            prefer_nhwc: _IntLike | None = None,
            output_format: _IntLike | None = None,
            tf32: _IntLike | None = None,
            flexible_output_prop: _AnyStr | None = None,
        ) -> VideoNode | _ReturnDict_ort_Model: ...

class _Wrapper_VideoNode_bound_ort_Model:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            provider: _AnyStr | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            cudnn_benchmark: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            prefer_nhwc: _IntLike | None = None,
            output_format: _IntLike | None = None,
            tf32: _IntLike | None = None,
            flexible_output_prop: None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            provider: _AnyStr | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            cudnn_benchmark: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            prefer_nhwc: _IntLike | None = None,
            output_format: _IntLike | None = None,
            tf32: _IntLike | None = None,
            *,
            flexible_output_prop: _AnyStr,
        ) -> _ReturnDict_ort_Model: ...
        @overload
        def __call__(
            self,
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            provider: _AnyStr | None = None,
            device_id: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            cudnn_benchmark: _IntLike | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            path_is_serialization: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            prefer_nhwc: _IntLike | None = None,
            output_format: _IntLike | None = None,
            tf32: _IntLike | None = None,
            flexible_output_prop: _AnyStr | None = None,
        ) -> VideoNode | _ReturnDict_ort_Model: ...

class _ReturnDict_ov_Model(TypedDict):
    clip: VideoNode
    num_planes: int

class _Wrapper_Core_bound_ov_Model:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device: _AnyStr | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            config: _VSCallback_ov_Model_config | None = None,
            path_is_serialization: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            dot_path: _AnyStr | None = None,
            flexible_output_prop: None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device: _AnyStr | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            config: _VSCallback_ov_Model_config | None = None,
            path_is_serialization: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            dot_path: _AnyStr | None = None,
            *,
            flexible_output_prop: _AnyStr,
        ) -> _ReturnDict_ov_Model: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device: _AnyStr | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            config: _VSCallback_ov_Model_config | None = None,
            path_is_serialization: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            dot_path: _AnyStr | None = None,
            flexible_output_prop: _AnyStr | None = None,
        ) -> VideoNode | _ReturnDict_ov_Model: ...

class _Wrapper_VideoNode_bound_ov_Model:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device: _AnyStr | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            config: _VSCallback_ov_Model_config | None = None,
            path_is_serialization: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            dot_path: _AnyStr | None = None,
            flexible_output_prop: None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device: _AnyStr | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            config: _VSCallback_ov_Model_config | None = None,
            path_is_serialization: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            dot_path: _AnyStr | None = None,
            *,
            flexible_output_prop: _AnyStr,
        ) -> _ReturnDict_ov_Model: ...
        @overload
        def __call__(
            self,
            network_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device: _AnyStr | None = None,
            builtin: _IntLike | None = None,
            builtindir: _AnyStr | None = None,
            fp16: _IntLike | None = None,
            config: _VSCallback_ov_Model_config | None = None,
            path_is_serialization: _IntLike | None = None,
            fp16_blacklist_ops: _AnyStr | _SequenceLike[_AnyStr] | None = None,
            dot_path: _AnyStr | None = None,
            flexible_output_prop: _AnyStr | None = None,
        ) -> VideoNode | _ReturnDict_ov_Model: ...

class _ReturnDict_trt_Model(TypedDict):
    clip: VideoNode
    num_planes: int

class _Wrapper_Core_bound_trt_Model:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            flexible_output_prop: None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            *,
            flexible_output_prop: _AnyStr,
        ) -> _ReturnDict_trt_Model: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            flexible_output_prop: _AnyStr | None = None,
        ) -> VideoNode | _ReturnDict_trt_Model: ...

class _Wrapper_VideoNode_bound_trt_Model:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            flexible_output_prop: None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            *,
            flexible_output_prop: _AnyStr,
        ) -> _ReturnDict_trt_Model: ...
        @overload
        def __call__(
            self,
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            flexible_output_prop: _AnyStr | None = None,
        ) -> VideoNode | _ReturnDict_trt_Model: ...

class _ReturnDict_trt_rtx_Model(TypedDict):
    clip: VideoNode
    num_planes: int

class _Wrapper_Core_bound_trt_rtx_Model:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            flexible_output_prop: None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            *,
            flexible_output_prop: _AnyStr,
        ) -> _ReturnDict_trt_rtx_Model: ...
        @overload
        def __call__(
            self,
            clips: VideoNode | _SequenceLike[VideoNode],
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            flexible_output_prop: _AnyStr | None = None,
        ) -> VideoNode | _ReturnDict_trt_rtx_Model: ...

class _Wrapper_VideoNode_bound_trt_rtx_Model:
    class Function(_VSFunction):
        def __init__[PluginT: Plugin](self, function: Callable[Concatenate[PluginT, ...], VideoNode]) -> None: ...
        @overload
        def __call__(
            self,
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            flexible_output_prop: None = None,
        ) -> VideoNode: ...
        @overload
        def __call__(
            self,
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            *,
            flexible_output_prop: _AnyStr,
        ) -> _ReturnDict_trt_rtx_Model: ...
        @overload
        def __call__(
            self,
            engine_path: _AnyStr,
            overlap: _IntLike | _SequenceLike[_IntLike] | None = None,
            tilesize: _IntLike | _SequenceLike[_IntLike] | None = None,
            device_id: _IntLike | None = None,
            use_cuda_graph: _IntLike | None = None,
            num_streams: _IntLike | None = None,
            verbosity: _IntLike | None = None,
            flexible_output_prop: _AnyStr | None = None,
        ) -> VideoNode | _ReturnDict_trt_rtx_Model: ...
