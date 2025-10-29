from typing import Final, Iterator, Literal, Self, TypedDict

from .constants import AudioChannels, ColorFamily, SampleType

class _VideoFormatDict(TypedDict):
    id: int
    name: str
    color_family: ColorFamily
    sample_type: SampleType
    bits_per_sample: Literal[
        8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32
    ]
    bytes_per_sample: int
    subsampling_w: Literal[0, 1, 2, 3, 4]
    subsampling_h: Literal[0, 1, 2, 3, 4]
    num_planes: Literal[1, 3]

class VideoFormat:
    id: Final[int]
    name: Final[str]
    color_family: Final[ColorFamily]
    sample_type: Final[SampleType]
    bits_per_sample: Final[
        Literal[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]
    ]
    bytes_per_sample: Final[int]
    subsampling_w: Final[Literal[0, 1, 2, 3, 4]]
    subsampling_h: Final[Literal[0, 1, 2, 3, 4]]
    num_planes: Final[Literal[1, 3]]
    def __repr__(self) -> str: ...
    def __str__(self) -> str: ...
    def __eq__(self, other: object) -> bool: ...
    def __hash__(self) -> int: ...
    def __int__(self) -> int: ...
    def replace(
        self,
        *,
        color_family: ColorFamily = ...,
        sample_type: SampleType = ...,
        bits_per_sample: int = ...,
        subsampling_w: int = ...,
        subsampling_h: int = ...,
    ) -> Self: ...
    def _as_dict(self) -> _VideoFormatDict: ...

# Behave like a Collection
class ChannelLayout(int):
    def __repr__(self) -> str: ...
    def __str__(self) -> str: ...
    def __contains__(self, layout: AudioChannels) -> bool: ...
    def __iter__(self) -> Iterator[AudioChannels]: ...
    def __len__(self) -> int: ...
