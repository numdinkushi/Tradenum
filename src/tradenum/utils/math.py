from __future__ import annotations

from tradenum.domain.constants import SMA_FAST, SMA_SLOW
from tradenum.domain.enums import Regime


def sma(values: list[float], window: int) -> float:
    slice_ = values[-window:]
    return sum(slice_) / len(slice_)


def realized_vol(closes: list[float], lookback: int = 20) -> float:
    rets = []
    window = closes[-(lookback + 1) :]
    for a, b in zip(window, window[1:]):
        if a:
            rets.append((b - a) / a)
    if not rets:
        return 0.0
    return (sum(r * r for r in rets) / len(rets)) ** 0.5 * (252**0.5)


def regime_from_closes(closes: list[float]) -> tuple[float, float, float, float, Regime]:
    price = closes[-1]
    fast = sma(closes, SMA_FAST)
    slow = sma(closes, SMA_SLOW)
    vol = realized_vol(closes)
    return price, fast, slow, vol, Regime.from_mas(price, fast, slow)


def quote_mid(quotes: dict, symbol: str) -> float:
    q = quotes.get(symbol)
    if q is None:
        return 0.4
    bid = float(getattr(q, "bid", 0) or 0)
    ask = float(getattr(q, "ask", 0) or 0)
    if bid and ask:
        return (bid + ask) / 2
    return bid or ask or 0.4
