from tradenum.explain import ticket_plain
from tradenum.models import Leg, Proposal, Structure, Ticket, TicketStatus, utcnow


def test_veto_reads_in_plain_english():
    ticket = Ticket(
        id="TN-0001",
        created_at=utcnow(),
        updated_at=utcnow(),
        status=TicketStatus.VETOED,
        proposal=Proposal(
            underlying="NVDA",
            structure=Structure.BULL_PUT_CREDIT,
            thesis="test",
            regime="up",
            confidence=0.7,
            dte=10,
            width=5,
            credit=0.4,
            max_loss=460,
            max_profit=40,
            legs=[
                Leg(symbol="A", side="sell"),
                Leg(symbol="B", side="buy"),
            ],
        ),
        veto_reason="risk_reward: too skinny",
    )
    text = ticket_plain(ticket)
    assert "Rejected" in text
    assert "risk_reward" in text
    assert "at most $460" in text
