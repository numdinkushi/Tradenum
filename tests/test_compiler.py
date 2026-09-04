from tradenum.domain.enums import PositionIntent, Side
from tradenum.execution.compiler import compile_open_order
from tradenum.models import Leg, Proposal, Structure, Ticket, TicketStatus, utcnow


def test_open_order_uses_mleg_and_intents():
    ticket = Ticket(
        id="TN-0001",
        created_at=utcnow(),
        updated_at=utcnow(),
        status=TicketStatus.PROPOSED,
        proposal=Proposal(
            underlying="SPY",
            structure=Structure.BULL_PUT_CREDIT,
            thesis="t",
            regime="up",
            confidence=0.7,
            dte=21,
            width=5,
            credit=1.3,
            max_loss=370,
            max_profit=130,
            legs=[
                Leg(symbol="A", side=Side.SELL, strike=620, right="put"),
                Leg(symbol="B", side=Side.BUY, strike=615, right="put"),
            ],
        ),
    )
    payload = compile_open_order(ticket)
    assert payload["order_class"] == "mleg"
    assert payload["client_order_id"] == "TN-0001"
    assert payload["limit_price"] == "-1.3"
    assert payload["legs"][0]["position_intent"] == PositionIntent.SELL_TO_OPEN
    assert payload["legs"][1]["position_intent"] == PositionIntent.BUY_TO_OPEN
