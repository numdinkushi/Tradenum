from __future__ import annotations

from datetime import date, datetime, timezone

from tradenum.domain.constants import DEMO_SPOT, PAPER_EQUITY
from tradenum.domain.enums import Regime, Right
from tradenum.domain.models import (
    AccountSnapshot,
    ClockSnapshot,
    OptionContract,
    OrderAck,
    Position,
    Quote,
    UnderlyingSnapshot,
)
from tradenum.utils.bars import synthetic_ohlc
from tradenum.utils.options import demo_spot, next_friday, occ_symbol, parse_occ, strike_step


class DemoMarket:
    live = False

    def account(self) -> AccountSnapshot:
        return AccountSnapshot(
            equity=PAPER_EQUITY,
            cash=PAPER_EQUITY,
            buying_power=PAPER_EQUITY,
            last_equity=PAPER_EQUITY,
            paper=True,
            live_broker=False,
            raw={"mode": "demo", "status": "ACTIVE"},
        )

    def clock(self) -> ClockSnapshot:
        return ClockSnapshot(is_open=True, timestamp=datetime.now(timezone.utc).isoformat(), mode="demo")

    def snapshot_underlying(self, symbol: str) -> UnderlyingSnapshot:
        price = demo_spot(symbol)
        regime = {
            "SPY": Regime.UP,
            "QQQ": Regime.UP,
            "IWM": Regime.RANGE,
            "AAPL": Regime.DOWN,
            "MSFT": Regime.RANGE,
            "NVDA": Regime.UP,
        }.get(symbol, Regime.RANGE)
        if regime is Regime.UP:
            sma20, sma50 = price * 0.985, price * 0.97
        elif regime is Regime.DOWN:
            sma20, sma50 = price * 1.015, price * 1.03
        else:
            sma20, sma50 = price * 1.002, price * 0.998
        return UnderlyingSnapshot(
            symbol=symbol,
            price=price,
            sma20=sma20,
            sma50=sma50,
            realized_vol=0.18 if regime is Regime.RANGE else 0.22,
            regime=regime,
            bars=synthetic_ohlc(symbol, price),
        )

    def option_chain(self, symbol: str, expiration: date, right: Right) -> list[OptionContract]:
        px = demo_spot(symbol)
        step = strike_step(px)
        contracts = []
        for i in range(-8, 9):
            strike = round((px // step) * step + i * step, 2)
            contracts.append(
                OptionContract(
                    symbol=occ_symbol(symbol, expiration, right, strike),
                    strike=strike,
                    expiration=expiration.isoformat(),
                    right=right,
                    open_interest=5000 - abs(i) * 200,
                )
            )
        return contracts

    def option_quotes(self, symbols: list[str]) -> dict[str, Quote]:
        return {s: self._quote(s) for s in symbols}

    def next_expiry(self, min_dte: int, max_dte: int) -> date:
        return next_friday(min_dte, max_dte)

    def submit_order(self, payload: dict) -> OrderAck:
        cid = payload.get("client_order_id", "demo")
        return OrderAck(id=f"demo-{cid}", status="accepted", client_order_id=cid)

    def positions(self) -> list[Position]:
        return []

    def close_position(self, symbol: str) -> None:
        return None

    def _quote(self, symbol: str) -> Quote:
        root, right, strike = parse_occ(symbol)
        spot = DEMO_SPOT.get(root, 100.0)
        dist = abs(spot - strike) / max(spot, 1)
        time_value = max(0.18, spot * 0.02 * (2.718 ** (-dist * 28)))
        intrinsic = max(strike - spot, 0) if right is Right.PUT else max(spot - strike, 0)
        mid = intrinsic + time_value
        return Quote(bid=round(max(mid - 0.06, 0.05), 2), ask=round(mid + 0.06, 2))
