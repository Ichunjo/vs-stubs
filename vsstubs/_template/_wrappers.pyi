from typing import Callable, Concatenate

from .plugin import Function, Plugin

_VSFunction = Function

class _Wrapper:
    class Function[**_P, _R](_VSFunction):
        def __init__[_PluginT: Plugin](self, function: Callable[Concatenate[_PluginT, _P], _R]) -> None: ...
        def __call__(self, *args: _P.args, **kwargs: _P.kwargs) -> _R: ...
