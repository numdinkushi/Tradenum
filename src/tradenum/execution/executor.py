from __future__ import annotations

from tradenum.domain.enums import TicketStatus
from tradenum.domain.models import Ticket
from tradenum.execution.compiler import compile_open_order
from tradenum.ports.market import MarketGateway


class Executor:
    def __init__(self, market: MarketGateway) -> None:
        self.market = market

    def submit(self, ticket: Ticket) -> Ticket:
        payload = compile_open_order(ticket)
        ticket.order_payload = payload
        ack = self.market.submit_order(payload)
        ticket.alpaca_order_id = ack.id
        ticket.client_order_id = ticket.id
        ticket.fill_price = ticket.proposal.credit or ticket.proposal.debit
        ticket.status = TicketStatus.SUPERVISING
        ticket.stamp("executed", order=ack.model_dump(), payload=payload)
        return ticket
