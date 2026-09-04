from __future__ import annotations

from tradenum.domain.enums import OrderClass, OrderType, TimeInForce
from tradenum.domain.models import Ticket


def compile_open_order(ticket: Ticket) -> dict:
    """Exact POST /v2/orders body. Credit = negative limit_price."""
    proposal = ticket.proposal
    payload: dict = {
        "order_class": OrderClass.MLEG.value,
        "type": OrderType.LIMIT.value if proposal.signed_limit is not None else OrderType.MARKET.value,
        "time_in_force": TimeInForce.DAY.value,
        "qty": str(proposal.qty),
        "client_order_id": ticket.id,
        "legs": [
            {
                "symbol": leg.symbol,
                "side": leg.side.value,
                "ratio_qty": str(leg.ratio_qty),
                "position_intent": leg.open_intent.value,
            }
            for leg in proposal.legs
        ],
    }
    if proposal.signed_limit is not None:
        payload["limit_price"] = str(proposal.signed_limit)
    return payload


def compile_close_order(ticket: Ticket) -> dict:
    proposal = ticket.proposal
    return {
        "order_class": OrderClass.MLEG.value,
        "type": OrderType.MARKET.value,
        "time_in_force": TimeInForce.DAY.value,
        "qty": str(proposal.qty),
        "client_order_id": f"{ticket.id}-x",
        "legs": [
            {
                "symbol": leg.symbol,
                "side": leg.side.close_side.value,
                "ratio_qty": str(leg.ratio_qty),
                "position_intent": leg.close_intent.value,
            }
            for leg in proposal.legs
        ],
    }
