from tradenum.domain.copy import GATE_PLAIN, REGIME_PLAIN, STATUS_PLAIN, STRUCTURE_PLAIN
from tradenum.domain.enums import Structure, TicketStatus
from tradenum.domain.models import Ticket


def label(mapping: dict, key, fallback: str | None = None) -> str:
    return mapping.get(key, fallback or str(key))


def structure_plain(structure: Structure) -> str:
    return STRUCTURE_PLAIN[structure]


def ticket_headline(ticket: Ticket) -> str:
    p = ticket.proposal
    return f"{ticket.id} · {p.underlying} · {p.structure.value.replace('_', ' ')}"


def ticket_plain(ticket: Ticket) -> str:
    p = ticket.proposal
    bits = [
        STATUS_PLAIN[ticket.status],
        label(REGIME_PLAIN, p.regime, p.regime.value),
        structure_plain(p.structure),
        f"If this works, about ${p.max_profit:.0f}. If it fails, at most ${p.max_loss:.0f} (per contract set).",
    ]
    if ticket.status == TicketStatus.VETOED and ticket.veto_reason:
        bits.append(f"Why it was blocked: {ticket.veto_reason}")
    return " ".join(bits)
