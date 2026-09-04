from tradenum.utils.bars import synthetic_ohlc


def test_synthetic_ohlc_is_deterministic_and_ends_near_spot() -> None:
    a = synthetic_ohlc("NVDA", 170.0, n=40)
    b = synthetic_ohlc("NVDA", 170.0, n=40)
    assert a == b
    assert len(a) == 40
    assert a[-1]["c"] == 170.0
    for bar in a:
        assert bar["h"] >= max(bar["o"], bar["c"])
        assert bar["l"] <= min(bar["o"], bar["c"])
