from types import MappingProxyType
from typing import Literal, NamedTuple

from ._typing import _IntLike
from .nodes import AudioNode, VideoNode

class VideoOutputTuple(NamedTuple):
    clip: VideoNode
    alpha: VideoNode | None
    alt_output: Literal[0, 1, 2]

def clear_output(index: _IntLike = 0) -> None: ...
def clear_outputs() -> None: ...
def get_outputs() -> MappingProxyType[int, VideoOutputTuple | AudioNode]: ...
def get_output(index: _IntLike = 0) -> VideoOutputTuple | AudioNode: ...
