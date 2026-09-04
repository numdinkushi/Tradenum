from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from tradenum.domain.enums import GateName, PositionIntent, Regime, Right, Side, Structure, TicketStatus
from tradenum.utils.time import utcnow


class GateResult(BaseModel):
    name: GateName
    passed: bool
    detail: str


class Quote(BaseModel):
    bid: float = 0.0
    ask: float = 0.0

    @property
    def mid(self) -> float:
        if self.bid and self.ask:
            return (self.bid + self.ask) / 2
        return self.bid or self.ask or 0.4


class OptionContract(BaseModel):
    symbol: str
    strike: float
    expiration: str
    right: Right
    open_interest: int = 0


class Leg(BaseModel):
    symbol: str
    side: Side
    ratio_qty: int = 1
    strike: float | None = None
    right: Right | None = None
    expiration: str | None = None
    bid: float | None = None
    ask: float | None = None

    @property
    def open_intent(self) -> PositionIntent:
        return self.side.open_intent

    @property
    def close_intent(self) -> PositionIntent:
        return self.side.close_intent


class Proposal(BaseModel):
    underlying: str
    structure: Structure
    thesis: str
    regime: Regime
    confidence: float = Field(ge=0, le=1)
    dte: int
    width: float
    credit: float | None = None
    debit: float | None = None
    max_loss: float
    max_profit: float
    qty: int = 1
    legs: list[Leg]
    greeks: dict[str, float] = Field(default_factory=dict)
    market: dict[str, Any] = Field(default_factory=dict)
    source: str = "heuristic"

    @property
    def signed_limit(self) -> float | None:
        if self.credit:
            return -abs(round(self.credit, 2))
        if self.debit:
            return abs(round(self.debit, 2))
        return None

    @property
    def has_hedge(self) -> bool:
        sides = {leg.side for leg in self.legs}
        return Side.BUY in sides and Side.SELL in sides


class Ticket(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    status: TicketStatus
    proposal: Proposal
    gates: list[GateResult] = Field(default_factory=list)
    veto_reason: str | None = None
    alpaca_order_id: str | None = None
    client_order_id: str | None = None
    fill_price: float | None = None
    unrealized_pnl: float | None = None
    realized_pnl: float | None = None
    close_reason: str | None = None
    order_payload: dict[str, Any] | None = None
    events: list[dict[str, Any]] = Field(default_factory=list)

    def stamp(self, event: str, **payload: Any) -> None:
        self.updated_at = utcnow()
        self.events.append({"at": self.updated_at.isoformat(), "event": event, **payload})


class AccountSnapshot(BaseModel):
    equity: float
    cash: float
    buying_power: float
    last_equity: float | None = None
    paper: bool = True
    live_broker: bool = False
    raw: dict[str, Any] = Field(default_factory=dict)


class ClockSnapshot(BaseModel):
    is_open: bool
    timestamp: str
    next_open: str | None = None
    next_close: str | None = None
    mode: str | None = None


class UnderlyingSnapshot(BaseModel):
    symbol: str
    price: float
    sma20: float
    sma50: float
    realized_vol: float
    regime: Regime
    bars: list[dict[str, Any]] = Field(default_factory=list)


class Position(BaseModel):
    symbol: str
    qty: float
    avg_entry: float
    unrealized_pl: float
    market_value: float


class OrderAck(BaseModel):
    id: str
    status: str
    client_order_id: str
