"""Typing stubs for VapourSynth."""

from .func import output_stubs

__version__: str
__version_tuple__: tuple[int | str, ...]

try:
    from ._version import __version__, __version_tuple__
except ImportError:
    __version__ = "0.0.0+unknown"
    __version_tuple__ = (0, 0, 0, "+unknown")


__all__ = ["output_stubs"]
