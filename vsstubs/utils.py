from __future__ import annotations

import sys
from functools import cache
from inspect import Parameter
from pathlib import Path
from typing import Any, Iterable, Sequence

from vapoursynth import GRAY8, Plugin, core, register_on_destroy

from .constants import _VSCALLBACK_SIGNATURE
from .types import (
    FunctionInterface,
    HasNameSpace,
    PluginInterface,
    UnionLike,
    VSCallbackTypeLike,
    _CoreLike,
    parse_type,
)


def running_via_cli() -> bool:
    # When launched via the installed script (entry point)
    if Path(sys.argv[0]).stem == "vsstubs":
        return True

    # When launched as: python -m vsstubs
    # The main module will be vsstubs.__main__, but argv[0] will be python.
    # So we detect that by checking the *module* that is actually running
    main_mod = sys.modules.get("__main__")
    return bool(main_mod and main_mod.__package__ == "vsstubs")


def _get_typed_dict_repr(d: type) -> str:
    """Workaround function to deal with a badly repr for typed dict."""

    def _pretty_type(value: Any) -> str:
        if isinstance(value, type):
            return str(value.__name__)
        return parse_type(value, True)

    sig = "{" + ", ".join(f'"{n}": {_pretty_type(v)}' for n, v in d.__annotations__.items()) + "}"
    name = d.__name__

    return f'{name} = TypedDict("{name}", {sig})'


def _replace_known_callback_signature(
    param: Parameter, interface: PluginInterface, function: FunctionInterface
) -> Parameter:
    ann = VSCallbackTypeLike(
        _VSCALLBACK_SIGNATURE.format(plugin=interface.namespace, func=function.name, param=param.name)
    )

    if not isinstance(param.annotation, VSCallbackTypeLike):
        ann = UnionLike[*(ann if isinstance(arg, VSCallbackTypeLike) else arg for arg in param.annotation.__args__)]

    return param.replace(annotation=ann)


def _index_by_namespace[HasNameSpaceT: HasNameSpace](impls: Iterable[HasNameSpaceT]) -> dict[str, HasNameSpaceT]:
    return {impl.namespace: impl for impl in impls}


@cache
def _get_default_stubs_path() -> Path:
    import vapoursynth

    return Path(vapoursynth.__file__).parent / "vapoursynth-stubs" / "__init__.pyi"


@cache
def _get_plugins() -> Sequence[Plugin]:
    return tuple(core.plugins())


@cache
def _get_dir(has_dir: Any) -> list[str]:
    return dir(has_dir)


@cache
def _get_cores() -> Sequence[_CoreLike]:
    return [
        core.core,
        core.std.BlankClip(None, 1, 1, GRAY8, 1, 1, 1, 0, True),
        core.std.BlankAudio(None, length=1, keep=True),
    ]


register_on_destroy(_get_plugins.cache_clear)
register_on_destroy(_get_dir.cache_clear)
register_on_destroy(_get_cores.cache_clear)
