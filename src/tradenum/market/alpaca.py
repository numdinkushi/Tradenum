from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from tradenum.config import Settings
from tradenum.domain.constants import BARS_LOOKBACK_DAYS
from tradenum.domain.enums import Right, Side
from tradenum.domain.models import (
    AccountSnapshot,
    ClockSnapshot,
    OptionContract,
    OrderAck,
    Position,
    Quote,
    UnderlyingSnapshot,
)
from tradenum.utils.math import regime_from_closes
from tradenum.utils.options import next_friday


class AlpacaMarket:
    def __init__(self, settings: Settings) -> None:
        from alpaca.data.historical.option import OptionHistoricalDataClient
        from alpaca.data.historical.stock import StockHistoricalDataClient
        from alpaca.trading.client import TradingClient

        self._trading = TradingClient(settings.alpaca_api_key, settings.alpaca_secret_key, paper=True)
        self._stock_data = StockHistoricalDataClient(settings.alpaca_api_key, settings.alpaca_secret_key)
        self._option_data = OptionHistoricalDataClient(settings.alpaca_api_key, settings.alpaca_secret_key)

    @property
    def live(self) -> bool:
        return True

    def account(self) -> AccountSnapshot:
        acct = self._trading.get_account()
        last = getattr(acct, "last_equity", None)
        try:
            last_equity = float(last) if last not in (None, "") else None
        except (TypeError, ValueError):
            last_equity = None
        return AccountSnapshot(
            equity=float(acct.equity),
            cash=float(acct.cash),
            buying_power=float(acct.buying_power),
            last_equity=last_equity,
            paper=True,
            live_broker=True,
            raw=acct.model_dump() if hasattr(acct, "model_dump") else {},
        )

    def clock(self) -> ClockSnapshot:
        clock = self._trading.get_clock()
        return ClockSnapshot(
            is_open=bool(clock.is_open),
            timestamp=str(clock.timestamp),
            next_open=str(clock.next_open),
            next_close=str(clock.next_close),
        )

    def snapshot_underlying(self, symbol: str) -> UnderlyingSnapshot | None:
        from alpaca.data.requests import StockBarsRequest
        from alpaca.data.timeframe import TimeFrame

        end = datetime.now(timezone.utc)
        req = StockBarsRequest(
            symbol_or_symbols=symbol,
            timeframe=TimeFrame.Day,
            start=end - timedelta(days=BARS_LOOKBACK_DAYS),
            end=end,
        )
        frame = (self._stock_data.get_stock_bars(req).data.get(symbol) or [])
        if len(frame) < 50:
            return None
        closes = [float(b.close) for b in frame]
        price, sma20, sma50, vol, regime = regime_from_closes(closes)
        return UnderlyingSnapshot(
            symbol=symbol,
            price=price,
            sma20=sma20,
            sma50=sma50,
            realized_vol=vol,
            regime=regime,
            bars=[
                {
                    "t": b.timestamp.date().isoformat()
                    if hasattr(b.timestamp, "date")
                    else str(b.timestamp)[:10],
                    "o": float(b.open),
                    "h": float(b.high),
                    "l": float(b.low),
                    "c": float(b.close),
                }
                for b in frame[-80:]
            ],
        )

    def option_chain(self, symbol: str, expiration: date, right: Right) -> list[OptionContract]:
        from alpaca.trading.enums import AssetStatus, ContractType
        from alpaca.trading.requests import GetOptionContractsRequest

        ctype = ContractType.CALL if right is Right.CALL else ContractType.PUT
        req = GetOptionContractsRequest(
            underlying_symbols=[symbol],
            status=AssetStatus.ACTIVE,
            expiration_date=expiration,
            type=ctype,
            limit=1000,
        )
        resp = self._trading.get_option_contracts(req)
        contracts = getattr(resp, "option_contracts", None) or []
        return [
            OptionContract(
                symbol=c.symbol,
                strike=float(c.strike_price),
                expiration=str(c.expiration_date),
                right=right,
                open_interest=int(c.open_interest or 0),
            )
            for c in contracts
        ]

    def option_quotes(self, symbols: list[str]) -> dict[str, Quote]:
        if not symbols:
            return {}
        from alpaca.data.requests import OptionLatestQuoteRequest

        quotes = self._option_data.get_option_latest_quote(OptionLatestQuoteRequest(symbol_or_symbols=symbols))
        data = quotes.data if hasattr(quotes, "data") else quotes
        items = data.items() if isinstance(data, dict) else [(symbols[0], quotes)]
        out: dict[str, Quote] = {}
        for sym, q in items:
            out[sym] = Quote(
                bid=float(getattr(q, "bid_price", 0) or 0),
                ask=float(getattr(q, "ask_price", 0) or 0),
            )
        return out

    def next_expiry(self, min_dte: int, max_dte: int) -> date:
        return next_friday(min_dte, max_dte)

    def submit_order(self, payload: dict) -> OrderAck:
        from alpaca.trading.enums import OrderClass as AlpacaOrderClass
        from alpaca.trading.enums import OrderSide, TimeInForce as AlpacaTif
        from alpaca.trading.requests import LimitOrderRequest, MarketOrderRequest, OptionLegRequest

        legs = [
            OptionLegRequest(
                symbol=leg["symbol"],
                side=OrderSide.BUY if leg["side"] == Side.BUY else OrderSide.SELL,
                ratio_qty=float(leg["ratio_qty"]),
            )
            for leg in payload["legs"]
        ]
        common = dict(
            qty=float(payload["qty"]),
            order_class=AlpacaOrderClass.MLEG,
            time_in_force=AlpacaTif.DAY,
            legs=legs,
            client_order_id=payload.get("client_order_id"),
        )
        limit = payload.get("limit_price")
        req = (
            LimitOrderRequest(limit_price=float(limit), **common)
            if limit is not None
            else MarketOrderRequest(**common)
        )
        order = self._trading.submit_order(req)
        return OrderAck(id=str(order.id), status=str(order.status), client_order_id=str(order.client_order_id))

    def positions(self) -> list[Position]:
        return [
            Position(
                symbol=p.symbol,
                qty=float(p.qty),
                avg_entry=float(p.avg_entry_price),
                unrealized_pl=float(p.unrealized_pl),
                market_value=float(p.market_value),
            )
            for p in self._trading.get_all_positions()
        ]

    def close_position(self, symbol: str) -> None:
        self._trading.close_position(symbol)
