from collections.abc import Iterator

import pytest

from vsstubs.types import parse_type


@pytest.fixture(autouse=True)
def clean_policy() -> Iterator[None]:
    parse_type.cache_clear()
    yield
    parse_type.cache_clear()
