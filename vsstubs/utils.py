from __future__ import annotations

from functools import cache
from inspect import Parameter
from pathlib import Path
from sys import argv
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
    if __name__ == "__main__":
        return True

    return bool(argv and argv[0].endswith("vsstubs"))


def _get_typed_dict_repr(d: type) -> str:
    """Workaround function to deal with a badly repr for typed dict."""

    def _pretty_type(value: Any) -> str:
        if isinstance(value, type):
            return str(value.__name__)
        return parse_type(value, True)

    sig = "{" + ", ".join(f'"{n}": {_pretty_type(v)}' for n, v in d.__annotations__.items()) + "}"
    name = d.__name__

    return f'{name} = TypedDict("{name}", {sig})'


def _clean_signature(signature: str) -> str:
    return signature.replace("vapoursynth.", "").replace("str | bytes | bytearray", "_AnyStr")


def _replace_known_callback_signatures(
    param_names: set[str], parameters: dict[str, Parameter], interface: PluginInterface, function: FunctionInterface
) -> None:
    for name in param_names:
        param = parameters[name]

        if not isinstance(param.annotation, UnionLike):
            raise NotImplementedError

        param = param.replace(
            annotation=UnionLike(
                [
                    VSCallbackTypeLike(
                        _VSCALLBACK_SIGNATURE.format(plugin=interface.namespace, func=function.name, param=name)
                    )
                    if isinstance(arg, VSCallbackTypeLike)
                    else arg
                    for arg in param.annotation._args
                ]
            )
        )
        parameters[name] = param


def _index_by_namespace[HasNameSpaceT: HasNameSpace](impls: Iterable[HasNameSpaceT]) -> dict[str, HasNameSpaceT]:
    return {impl.namespace: impl for impl in impls}


def _echo_quiet(*args: Any, **kwargs: Any) -> None: ...


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
