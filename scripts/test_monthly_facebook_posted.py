"""Decision tests for the monthly Facebook post_log check. No database."""

import importlib.util
from pathlib import Path


def load():
    path = Path(__file__).resolve().parent / "monthly-facebook-row.py"
    spec = importlib.util.spec_from_file_location("monthly_facebook_posted", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_classify():
    classify = load().classify
    assert classify([]) == "waiting"
    assert classify(["111457913523107_1533838408762028"]) == "ok"
    assert classify([None]) == "bad"
    assert classify([""]) == "bad"
    assert classify(["a", "b"]) == "bad"
    assert classify(["a", None]) == "bad"


if __name__ == "__main__":
    test_classify()
    print("ok")
