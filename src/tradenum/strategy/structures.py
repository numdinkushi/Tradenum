from __future__ import annotations

from datetime import date

from tradenum.domain.constants import CONTRACT_MULTIPLIER, OTM_PCT, SPREAD_WIDTH
from tradenum.domain.copy import REGIME_TO_STRUCTURE
from tradenum.domain.enums import Right, Side, Structure
from tradenum.domain.models import Leg, OptionContract, Proposal, Quote, UnderlyingSnapshot
from tradenum.ports.market import MarketGateway
from tradenum.utils.math import quote_mid
from tradenum.utils.options import hedge_strike, nearest, pick_otm


def _leg(contract: OptionContract, side: Side, quote: Quote | None) -> Leg:
    q = quote or Quote()
    return Leg(
        symbol=contract.symbol,
        side=side,
        strike=contract.strike,
        right=contract.right,
        expiration=contract.expiration,
        bid=q.bid,
        ask=q.ask,
    )


def _credit_metrics(short: OptionContract, long: OptionContract, quotes: dict[str, Quote]) -> tuple[float, float, float, float]:
    credit = quote_mid(quotes, short.symbol) - quote_mid(quotes, long.symbol)
    width = abs(short.strike - long.strike)
    max_loss = max((width - credit) * CONTRACT_MULTIPLIER, 1)
    max_profit = max(credit * CONTRACT_MULTIPLIER, 1)
    return round(credit, 2), width, round(max_loss, 2), round(max_profit, 2)


class StructureBuilder:
    def __init__(self, market: MarketGateway) -> None:
        self.market = market

    def build(self, snap: UnderlyingSnapshot, dte: int, exp: date) -> Proposal | None:
        structure = REGIME_TO_STRUCTURE[snap.regime]
        calls = self.market.option_chain(snap.symbol, exp, Right.CALL)
        puts = self.market.option_chain(snap.symbol, exp, Right.PUT)
        if not calls or not puts:
            return None
        if structure is Structure.BULL_PUT_CREDIT:
            return self._vertical(snap, puts, Right.PUT, Structure.BULL_PUT_CREDIT, dte)
        if structure is Structure.BEAR_CALL_CREDIT:
            return self._vertical(snap, calls, Right.CALL, Structure.BEAR_CALL_CREDIT, dte)
        return self._iron_condor(snap, calls, puts, dte)

    def _vertical(
        self,
        snap: UnderlyingSnapshot,
        chain: list[OptionContract],
        right: Right,
        structure: Structure,
        dte: int,
    ) -> Proposal | None:
        short = pick_otm(chain, snap.price, right, OTM_PCT)
        if not short:
            return None
        target = hedge_strike(short, right, SPREAD_WIDTH)
        if right is Right.PUT:
            hedge_pool = [c for c in chain if c.strike < short.strike]
        else:
            hedge_pool = [c for c in chain if c.strike > short.strike]
        long = nearest(hedge_pool, target)
        if not long:
            return None
        quotes = self.market.option_quotes([short.symbol, long.symbol])
        credit, width, max_loss, max_profit = _credit_metrics(short, long, quotes)
        thesis = (
            f"{snap.symbol} {snap.regime.value}trend at {snap.price:.2f}. "
            f"Defined-risk {structure.value.replace('_', ' ')}."
        )
        return Proposal(
            underlying=snap.symbol,
            structure=structure,
            thesis=thesis,
            regime=snap.regime,
            confidence=0.7,
            dte=dte,
            width=width,
            credit=credit,
            max_loss=max_loss,
            max_profit=max_profit,
            legs=[
                _leg(short, Side.SELL, quotes.get(short.symbol)),
                _leg(long, Side.BUY, quotes.get(long.symbol)),
            ],
            market={"spot": snap.price, "rv": snap.realized_vol, "sma20": snap.sma20, "sma50": snap.sma50},
        )

    def _iron_condor(
        self,
        snap: UnderlyingSnapshot,
        calls: list[OptionContract],
        puts: list[OptionContract],
        dte: int,
    ) -> Proposal | None:
        short_put = pick_otm(puts, snap.price, Right.PUT, OTM_PCT)
        short_call = pick_otm(calls, snap.price, Right.CALL, OTM_PCT)
        if not short_put or not short_call:
            return None
        long_put = nearest([c for c in puts if c.strike < short_put.strike], hedge_strike(short_put, Right.PUT))
        long_call = nearest([c for c in calls if c.strike > short_call.strike], hedge_strike(short_call, Right.CALL))
        if not long_put or not long_call:
            return None
        symbols = [short_put.symbol, long_put.symbol, short_call.symbol, long_call.symbol]
        quotes = self.market.option_quotes(symbols)
        put_credit, put_width, _, _ = _credit_metrics(short_put, long_put, quotes)
        call_credit, call_width, _, _ = _credit_metrics(short_call, long_call, quotes)
        credit = round(put_credit + call_credit, 2)
        width = max(put_width, call_width)
        max_loss = round(max((width - credit) * CONTRACT_MULTIPLIER, 1), 2)
        max_profit = round(max(credit * CONTRACT_MULTIPLIER, 1), 2)
        return Proposal(
            underlying=snap.symbol,
            structure=Structure.IRON_CONDOR,
            thesis=(
                f"{snap.symbol} is range-bound at {snap.price:.2f}. "
                f"Iron condor profits inside {short_put.strike}/{short_call.strike}."
            ),
            regime=snap.regime,
            confidence=0.66 if snap.realized_vol < 0.28 else 0.58,
            dte=dte,
            width=width,
            credit=credit,
            max_loss=max_loss,
            max_profit=max_profit,
            legs=[
                _leg(short_put, Side.SELL, quotes.get(short_put.symbol)),
                _leg(long_put, Side.BUY, quotes.get(long_put.symbol)),
                _leg(short_call, Side.SELL, quotes.get(short_call.symbol)),
                _leg(long_call, Side.BUY, quotes.get(long_call.symbol)),
            ],
            market={"spot": snap.price, "rv": snap.realized_vol, "sma20": snap.sma20, "sma50": snap.sma50},
        )
