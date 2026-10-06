"""Decision tests for the all-channels post_log check. No database."""

import importlib.util
from pathlib import Path


def load():
    path = Path(__file__).resolve().parent / "monthly-channels-posted.py"
    spec = importlib.util.spec_from_file_location("monthly_channels_posted", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_classify_counts():
    classify = load().classify_counts
    assert classify({"linkedin": 1, "gbp": 1, "facebook": 1}) == "posted"
    assert classify({"linkedin": 2, "gbp": 1, "facebook": 1}) == "posted"
    assert classify({"linkedin": 1, "gbp": 1, "facebook": 0}) == "waiting"
    assert classify({"linkedin": 1, "gbp": 0, "facebook": 1}) == "waiting"
    assert classify({}) == "waiting"


if __name__ == "__main__":
    test_classify_counts()
    print("ok")
