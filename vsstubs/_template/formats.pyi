from typing import Final, Iterator, Self, TypedDict

from .constants import AudioChannels, ColorFamily, SampleType

class _VideoFormatDict(TypedDict):
    id: int
    name: str
    color_family: ColorFamily
    sample_type: SampleType
    bits_per_sample: int
    bytes_per_sample: int
    subsampling_w: int
    subsampling_h: int
    num_planes: int

class VideoFormat:
    id: Final[int]
    name: Final[str]
    color_family: Final[ColorFamily]
    sample_type: Final[SampleType]
    bits_per_sample: Final[int]
    bytes_per_sample: Final[int]
    subsampling_w: Final[int]
    subsampling_h: Final[int]
    num_planes: Final[int]

    def _as_dict(self) -> _VideoFormatDict: ...
    def replace(
        self,
        *,
        color_family: ColorFamily = ...,
        sample_type: SampleType = ...,
        bits_per_sample: int = ...,
        subsampling_w: int = ...,
        subsampling_h: int = ...,
    ) -> Self: ...
    def __eq__(self, other: object) -> bool: ...
    def __hash__(self) -> int: ...
    def __int__(self) -> int: ...
    def __repr__(self) -> str: ...
    def __str__(self) -> str: ...

# Behave like a Collection
class ChannelLayout(int):
    def __contains__(self, layout: AudioChannels) -> bool: ...
    def __iter__(self) -> Iterator[AudioChannels]: ...
    def __len__(self) -> int: ...
    def __repr__(self) -> str: ...
    def __str__(self) -> str: ...
