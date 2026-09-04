from pathlib import Path

from tradenum.ledger import Ledger
from tradenum.models import Leg, Proposal, Structure, Ticket, TicketStatus, utcnow


def test_ticket_ids_increment(tmp_path: Path):
    ledger = Ledger(tmp_path / "t.db")
    a = ledger.next_id()
    b = ledger.next_id()
    assert a == "TN-0001"
    assert b == "TN-0002"


def test_vetoes_persist(tmp_path: Path):
    ledger = Ledger(tmp_path / "t.db")
    ticket = Ticket(
        id=ledger.next_id(),
        created_at=utcnow(),
        updated_at=utcnow(),
        status=TicketStatus.VETOED,
        proposal=Proposal(
            underlying="QQQ",
            structure=Structure.IRON_CONDOR,
            thesis="no",
            regime="range",
            confidence=0.6,
            dte=14,
            width=5,
            credit=0.5,
            max_loss=450,
            max_profit=50,
            legs=[
                Leg(symbol="A", side="sell"),
                Leg(symbol="B", side="buy"),
            ],
        ),
        veto_reason="kill_switch",
    )
    ledger.save(ticket)
    loaded = Ledger(tmp_path / "t.db")
    assert loaded.stats()["vetoed"] == 1
    assert loaded.get("TN-0001").veto_reason == "kill_switch"
