from tradenum.config import Settings
from tradenum.gates import evaluate_gates, first_veto
from tradenum.models import Leg, Proposal, Structure, Ticket, TicketStatus, utcnow


def _proposal(**kwargs) -> Proposal:
    base = dict(
        underlying="SPY",
        structure=Structure.BULL_PUT_CREDIT,
        thesis="test",
        regime="up",
        confidence=0.7,
        dte=21,
        width=5,
        credit=1.2,
        max_loss=380,
        max_profit=120,
        qty=1,
        legs=[
            Leg(symbol="SPY260925P00620000", side="sell", strike=620, right="put"),
            Leg(symbol="SPY260925P00615000", side="buy", strike=615, right="put"),
        ],
    )
    base.update(kwargs)
    return Proposal(**base)


def _settings(**kwargs) -> Settings:
    s = Settings(alpaca_paper_trade=True, tradenum_kill_switch=False)
    for k, v in kwargs.items():
        setattr(s, k, v)
    return s


def test_defined_risk_passes():
    gates = evaluate_gates(_proposal(), _settings(), [], buying_power=50_000)
    assert first_veto(gates) is None
    assert all(g.passed for g in gates)


def test_naked_short_is_vetoed():
    p = _proposal(legs=[Leg(symbol="SPY260925P00620000", side="sell")])
    gates = evaluate_gates(p, _settings(), [], buying_power=50_000)
    assert first_veto(gates)
    assert any(g.name == "defined_risk" and not g.passed for g in gates)


def test_kill_switch_blocks_entries():
    gates = evaluate_gates(_proposal(), _settings(tradenum_kill_switch=True), [])
    assert any(g.name == "kill_switch" and not g.passed for g in gates)


def test_concentration_gate():
    existing = Ticket(
        id="TN-0001",
        created_at=utcnow(),
        updated_at=utcnow(),
        status=TicketStatus.SUPERVISING,
        proposal=_proposal(),
    )
    gates = evaluate_gates(_proposal(), _settings(), [existing], buying_power=50_000)
    assert any(g.name == "underlying_concentration" and not g.passed for g in gates)


def test_max_loss_cap():
    gates = evaluate_gates(_proposal(max_loss=5000), _settings(tradenum_max_loss_per_ticket=750), [])
    assert any(g.name == "max_loss" and not g.passed for g in gates)
