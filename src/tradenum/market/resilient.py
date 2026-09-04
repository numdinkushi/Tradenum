from __future__ import annotations

from datetime import date
from typing import Any

from tradenum.domain.enums import Right
from tradenum.domain.models import AccountSnapshot, ClockSnapshot, OptionContract, OrderAck, Position, Quote, UnderlyingSnapshot
from tradenum.ports.market import MarketGateway


class ResilientMarket:
    """Alpaca for the account and orders. Demo tape if market-data is blocked."""

    def __init__(self, primary: MarketGateway, fallback: MarketGateway) -> None:
        self._primary = primary
        self._fallback = fallback

    @property
    def live(self) -> bool:
        return self._primary.live

    def _data(self, name: str, *args: Any, **kwargs: Any) -> Any:
        try:
            result = getattr(self._primary, name)(*args, **kwargs)
        except Exception:
            return getattr(self._fallback, name)(*args, **kwargs)
        if result is None or result == [] or result == {}:
            return getattr(self._fallback, name)(*args, **kwargs)
        return result

    def account(self) -> AccountSnapshot:
        try:
            return self._primary.account()
        except Exception:
            return self._fallback.account()

    def clock(self) -> ClockSnapshot:
        try:
            return self._primary.clock()
        except Exception:
            return self._fallback.clock()

    def snapshot_underlying(self, symbol: str) -> UnderlyingSnapshot | None:
        return self._data("snapshot_underlying", symbol)

    def option_chain(self, symbol: str, expiration: date, right: Right) -> list[OptionContract]:
        return self._data("option_chain", symbol, expiration, right)

    def option_quotes(self, symbols: list[str]) -> dict[str, Quote]:
        return self._data("option_quotes", symbols)

    def next_expiry(self, min_dte: int, max_dte: int) -> date | None:
        return self._data("next_expiry", min_dte, max_dte)

    def submit_order(self, payload: dict) -> OrderAck:
        return self._primary.submit_order(payload)

    def positions(self) -> list[Position]:
        try:
            return self._primary.positions()
        except Exception:
            return self._fallback.positions()

    def close_position(self, symbol: str) -> None:
        self._primary.close_position(symbol)
