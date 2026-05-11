_CORE_IMPL_START = "# <plugins/bound/{core_name}>"
_CORE_IMPL_END = "# </plugins/bound/{core_name}>"
_ATTR_IMPL_START = "# <attribute/{core_name}_bound/{name}>"
_ATTR_IMPL_END = "# </attribute/{core_name}_bound/{name}>"

_PLUGINS_IMPL_START = "# <plugins/implementations>"
_PLUGINS_IMPL_END = "# </plugins/implementations>"
_IMPL_START = "# <implementation/{name}>"
_IMPL_END = "# </implementation/{name}>"

_VSCALLBACK_SIGNATURE = "_VSCallback_{plugin}_{func}_{param}"

_callback_signatures = {
    "akarin": {
        "PropExpr": {"dict"},
    },
    "descale": {
        "Decustom": {"custom_kernel"},
        "ScaleCustom": {"custom_kernel"},
    },
    "std": {
        "FrameEval": {"eval"},
        "Lut": {"function"},
        "Lut2": {"function"},
        "ModifyFrame": {"selector"},
    },
    "resize2": {
        "Custom": {"custom_kernel"},
    },
}

_wrappers = {
    "Core": {"FrameEval", "ModifyFrame"},
    "VideoNode": {"FrameEval", "ModifyFrame"},
}
