from tradenum.market.demo import DemoMarket
from tradenum.market.resilient import ResilientMarket


class BoomMarket(DemoMarket):
    def snapshot_underlying(self, symbol: str):  # type: ignore[override]
        raise RuntimeError("data feed blocked")


def test_resilient_market_falls_back_when_bars_fail() -> None:
    market = ResilientMarket(BoomMarket(), DemoMarket())
    snap = market.snapshot_underlying("NVDA")
    assert snap is not None
    assert snap.symbol == "NVDA"
    assert snap.bars
