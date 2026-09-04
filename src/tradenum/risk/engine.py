from __future__ import annotations

from tradenum.config import Settings
from tradenum.domain.models import GateResult, Proposal, Ticket
from tradenum.risk.context import GateContext
from tradenum.risk.rules import GATES


def evaluate_gates(
    proposal: Proposal,
    settings: Settings,
    open_tickets: list[Ticket],
    buying_power: float | None = None,
    kill_switch: bool | None = None,
) -> list[GateResult]:
    ctx = GateContext(
        proposal=proposal,
        settings=settings,
        open_tickets=tuple(open_tickets),
        buying_power=buying_power,
        kill_switch=settings.tradenum_kill_switch if kill_switch is None else kill_switch,
    )
    return [result for gate in GATES if (result := gate(ctx)) is not None]


def first_veto(gates: list[GateResult]) -> str | None:
    failed = [g for g in gates if not g.passed]
    if not failed:
        return None
    return "; ".join(f"{g.name}: {g.detail}" for g in failed)
