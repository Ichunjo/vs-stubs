from inspect import Parameter, Signature

from vapoursynth import VideoNode

from vsstubs.stubs import construct_implementation, get_implementations_from_input
from vsstubs.types import FunctionInterface, PluginInterface


def test_construct_implementation() -> None:
    # Create a mock interface
    sig = Signature(
        [
            Parameter("clip", Parameter.POSITIONAL_OR_KEYWORD, annotation=VideoNode),
            Parameter("radius", Parameter.POSITIONAL_OR_KEYWORD, annotation=int, default=1),
        ],
        return_annotation=VideoNode,
    )

    func_int = FunctionInterface("Blur", sig)
    interface = PluginInterface("std", {"VideoNode": [func_int]}, "Standard plugins")

    impl = construct_implementation(interface, compat=False)

    assert impl.namespace == "std"
    assert "VideoNode" in impl.functions
    funcs = impl.functions["VideoNode"]
    assert len(funcs) == 1
    assert "Blur(self, /, clip: VideoNode, radius: _IntLike = 1) -> VideoNode: ..." in funcs[0].signature


def test_get_implementations_from_input() -> None:
    # A minimal stub string to test parsing
    stub_content = """
# <plugins/implementations>

# <implementation/std>

class _std:
    class _VideoNode_bound:
        class Plugin(_VSPlugin):
            @_Wrapper.Function
            def Blur(self, clip: VideoNode, radius: _IntLike = 1) -> VideoNode: ...

# </implementation/std>

# </plugins/implementations>

# <plugins/bound/VideoNode>
# <attribute/VideoNode_bound/std>
    std: Final[_std._VideoNode_bound.Plugin]
    \"\"\"Standard plugins\"\"\"
# </attribute/VideoNode_bound/std>
# </plugins/bound/VideoNode>
"""
    implementations = get_implementations_from_input(stub_content)
    assert len(implementations) == 1
    impl = implementations[0]
    assert impl.namespace == "std"
    assert impl.description == "Standard plugins"
    assert "VideoNode" in impl.functions
    # The regex normalizes whitespace
    assert (
        "Blur(self, clip: VideoNode, radius: _IntLike = 1) -> VideoNode: ..."
        in impl.functions["VideoNode"][0].signature
    )
