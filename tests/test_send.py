from pathlib import Path

import pytest

from tradenum.agent import TradeNumAgent
from tradenum.config import Settings
from tradenum.domain.enums import GateName, Side, Structure, TicketStatus
from tradenum.domain.models import GateResult, Leg, Proposal, Ticket
from tradenum.market.demo import DemoMarket
from tradenum.persistence.sqlite import SqliteLedger
from tradenum.utils.time import utcnow


def _agent(tmp_path: Path) -> TradeNumAgent:
    settings = Settings(alpaca_paper_trade=True, tradenum_kill_switch=False)
    settings.tradenum_ledger_path = tmp_path / "send.db"
    return TradeNumAgent(settings=settings, market=DemoMarket(), ledger=SqliteLedger(settings.tradenum_ledger_path))


def _ticket(*, status: TicketStatus, failed: list[GateName]) -> Ticket:
    gates = [
        GateResult(name=name, passed=name not in failed, detail=f"{name} check")
        for name in (GateName.PAPER_ONLY, GateName.KILL_SWITCH, GateName.DEFINED_RISK, GateName.LEG_COUNT, GateName.MIN_CREDIT)
    ]
    return Ticket(
        id="TN-0099",
        created_at=utcnow(),
        updated_at=utcnow(),
        status=status,
        veto_reason="; ".join(f"{n}: blocked" for n in failed) or None,
        proposal=Proposal(
            underlying="SPY",
            structure=Structure.BULL_PUT_CREDIT,
            thesis="t",
            regime="up",
            confidence=0.7,
            dte=21,
            width=5,
            credit=0.1,
            max_loss=370,
            max_profit=10,
            legs=[
                Leg(symbol="A", side=Side.SELL, strike=620, right="put"),
                Leg(symbol="B", side=Side.BUY, strike=615, right="put"),
            ],
        ),
        gates=gates,
        order_payload={"order_class": "mleg", "client_order_id": "TN-0099"},
    )


def test_send_held_ticket_without_override(tmp_path: Path) -> None:
    agent = _agent(tmp_path)
    ticket = _ticket(status=TicketStatus.PROPOSED, failed=[])
    agent.ledger.save(ticket)
    sent = agent.send("TN-0099", override=False)
    assert sent.status is TicketStatus.SUPERVISING
    assert sent.alpaca_order_id
    assert any(e["event"] == "human_send" for e in sent.events)


def test_send_vetoed_requires_override(tmp_path: Path) -> None:
    agent = _agent(tmp_path)
    agent.ledger.save(_ticket(status=TicketStatus.VETOED, failed=[GateName.MIN_CREDIT]))
    with pytest.raises(ValueError, match="override"):
        agent.send("TN-0099", override=False)


def test_send_vetoed_with_override_keeps_failed_gates(tmp_path: Path) -> None:
    agent = _agent(tmp_path)
    agent.ledger.save(_ticket(status=TicketStatus.VETOED, failed=[GateName.MIN_CREDIT]))
    sent = agent.send("TN-0099", override=True)
    assert sent.status is TicketStatus.SUPERVISING
    assert sent.veto_reason is None
    failed = [g for g in sent.gates if not g.passed]
    assert [g.name for g in failed] == [GateName.MIN_CREDIT]
    assert any(e["event"] == "human_override" for e in sent.events)


def test_send_cannot_override_defined_risk(tmp_path: Path) -> None:
    agent = _agent(tmp_path)
    agent.ledger.save(_ticket(status=TicketStatus.VETOED, failed=[GateName.DEFINED_RISK]))
    with pytest.raises(ValueError, match="Cannot override"):
        agent.send("TN-0099", override=True)
