from __future__ import annotations

from tradenum.domain.constants import STOP_FRACTION, TARGET_FRACTION, TIME_EXIT_DTE
from tradenum.domain.enums import TicketStatus
from tradenum.domain.models import Ticket
from tradenum.execution.compiler import compile_close_order
from tradenum.ports.market import MarketGateway


class Supervisor:
    def __init__(self, market: MarketGateway) -> None:
        self.market = market

    def review(self, ticket: Ticket) -> Ticket:
        if not ticket.status.is_live:
            return ticket
        by_symbol = {p.symbol: p for p in self.market.positions()}
        matched = [by_symbol[leg.symbol] for leg in ticket.proposal.legs if leg.symbol in by_symbol]
        if not matched:
            ticket.unrealized_pnl = 0.0
            ticket.stamp("supervise", note="no matching positions yet")
            return ticket
        pnl = sum(p.unrealized_pl for p in matched)
        ticket.unrealized_pnl = pnl
        max_loss, max_profit = ticket.proposal.max_loss, ticket.proposal.max_profit
        if pnl <= -STOP_FRACTION * max_loss:
            return self._flatten(ticket, pnl, f"stop: {int(STOP_FRACTION * 100)}% of max loss")
        if pnl >= TARGET_FRACTION * max_profit:
            return self._flatten(ticket, pnl, f"target: {int(TARGET_FRACTION * 100)}% of max credit")
        if ticket.proposal.dte <= TIME_EXIT_DTE and pnl >= 0:
            return self._flatten(ticket, pnl, f"time: take remaining credit under {TIME_EXIT_DTE} DTE")
        ticket.stamp("supervise", pnl=pnl)
        return ticket

    def _flatten(self, ticket: Ticket, pnl: float, reason: str) -> Ticket:
        payload = compile_close_order(ticket)
        try:
            self.market.submit_order(payload)
        except Exception:
            for leg in ticket.proposal.legs:
                try:
                    self.market.close_position(leg.symbol)
                except Exception as exc:  # noqa: BLE001
                    ticket.stamp("flatten_error", symbol=leg.symbol, error=str(exc))
        ticket.realized_pnl = pnl
        ticket.unrealized_pnl = 0.0
        ticket.close_reason = reason
        ticket.status = TicketStatus.CLOSED
        ticket.stamp("closed", reason=reason, pnl=pnl, payload=payload)
        return ticket
