from __future__ import annotations

from dataclasses import dataclass

from tradenum.config import Settings
from tradenum.domain.models import Proposal, Ticket


@dataclass(frozen=True)
class GateContext:
    proposal: Proposal
    settings: Settings
    open_tickets: tuple[Ticket, ...]
    buying_power: float | None
    kill_switch: bool

    @property
    def live(self) -> tuple[Ticket, ...]:
        return tuple(t for t in self.open_tickets if t.status.is_live)

    @property
    def same_underlying(self) -> tuple[Ticket, ...]:
        return tuple(t for t in self.live if t.proposal.underlying == self.proposal.underlying)
