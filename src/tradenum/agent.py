from __future__ import annotations

from tradenum.config import Settings, get_settings
from tradenum.domain.enums import GateName, TicketStatus
from tradenum.domain.models import Ticket
from tradenum.execution.compiler import compile_open_order
from tradenum.execution.executor import Executor
from tradenum.execution.supervisor import Supervisor
from tradenum.market.factory import create_market
from tradenum.persistence.sqlite import SqliteLedger
from tradenum.ports.ledger import LedgerPort
from tradenum.ports.market import MarketGateway
from tradenum.risk.engine import evaluate_gates, first_veto
from tradenum.strategy.proposer import Proposer
from tradenum.utils.time import utcnow

# Geometry the desk will not let a human skip. Quality gates (credit, R/R, DTE) are overridable.
HARD_SEND_GATES = frozenset(
    {
        GateName.PAPER_ONLY,
        GateName.KILL_SWITCH,
        GateName.DEFINED_RISK,
        GateName.LEG_COUNT,
    }
)


class TradeNumAgent:
    def __init__(
        self,
        settings: Settings | None = None,
        market: MarketGateway | None = None,
        ledger: LedgerPort | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.market = market or create_market(self.settings)
        self.ledger = ledger or SqliteLedger(self.settings.tradenum_ledger_path)
        self.proposer = Proposer(self.market, self.settings)
        self.executor = Executor(self.market)
        self.supervisor = Supervisor(self.market)

    def consider(self, symbol: str, execute: bool = True) -> Ticket | None:
        snap = self.market.snapshot_underlying(symbol)
        if not snap:
            return None
        proposal = self.proposer.propose(snap)
        if not proposal:
            return None
        ticket = Ticket(
            id=self.ledger.next_id(),
            created_at=utcnow(),
            updated_at=utcnow(),
            status=TicketStatus.PROPOSED,
            proposal=proposal,
            order_payload=None,
        )
        ticket.order_payload = compile_open_order(ticket)
        ticket.stamp("proposed", regime=snap.regime.value, structure=proposal.structure.value)
        ticket.gates = evaluate_gates(
            proposal,
            self.settings,
            self.ledger.open(),
            buying_power=self.market.account().buying_power,
        )
        veto = first_veto(ticket.gates)
        if veto:
            ticket.status = TicketStatus.VETOED
            ticket.veto_reason = veto
            ticket.stamp("vetoed", reason=veto)
            return self.ledger.save(ticket)
        if not execute:
            ticket.stamp("gated_dry_run")
            return self.ledger.save(ticket)
        try:
            self.executor.submit(ticket)
        except Exception as exc:  # noqa: BLE001
            ticket.status = TicketStatus.FAILED
            ticket.veto_reason = str(exc)
            ticket.stamp("failed", error=str(exc))
        return self.ledger.save(ticket)

    def send(self, ticket_id: str, *, override: bool = False) -> Ticket:
        """POST the compiled mleg. Override stamps failed quality gates and sends anyway."""
        ticket = self.ledger.get(ticket_id)
        if ticket is None:
            raise ValueError(f"Unknown ticket {ticket_id}.")
        if ticket.status.is_live or ticket.status is TicketStatus.CLOSED:
            raise ValueError(f"{ticket_id} is {ticket.status.value} — already on the book.")
        if self.settings.tradenum_kill_switch:
            raise ValueError("Kill switch is on. No new paper orders.")
        if not self.settings.paper_only:
            raise ValueError("Paper trading is required.")
        if not ticket.order_payload:
            ticket.order_payload = compile_open_order(ticket)
        failed = [g for g in ticket.gates if not g.passed]
        hard = [g for g in failed if g.name in HARD_SEND_GATES]
        if hard:
            raise ValueError(
                "Cannot override: " + "; ".join(f"{g.name}: {g.detail}" for g in hard)
            )
        if failed and not override:
            raise ValueError("Gates blocked. Confirm override to POST paper anyway.")
        if failed:
            ticket.stamp(
                "human_override",
                reason=ticket.veto_reason,
                gates=[g.name.value for g in failed],
            )
            ticket.veto_reason = None
        else:
            ticket.stamp("human_send")
        try:
            self.executor.submit(ticket)
        except Exception as exc:  # noqa: BLE001
            ticket.status = TicketStatus.FAILED
            ticket.veto_reason = str(exc)
            ticket.stamp("failed", error=str(exc))
        return self.ledger.save(ticket)

    def scan_once(self, execute: bool = True) -> list[Ticket]:
        return [t for symbol in self.settings.universe if (t := self.consider(symbol, execute=execute))]

    def supervise_open(self) -> list[Ticket]:
        updated = []
        for ticket in self.ledger.open():
            ticket = self.supervisor.review(ticket)
            self.ledger.save(ticket)
            updated.append(ticket)
        return updated

    def chart(self, symbol: str) -> dict:
        snap = None
        try:
            snap = self.market.snapshot_underlying(symbol.upper())
        except Exception:
            snap = None
        if not snap or not snap.bars:
            from tradenum.utils.bars import synthetic_ohlc
            from tradenum.utils.options import demo_spot

            price = demo_spot(symbol.upper())
            return {
                "symbol": symbol.upper(),
                "price": price,
                "regime": "range",
                "bars": synthetic_ohlc(symbol.upper(), price),
            }
        return {
            "symbol": snap.symbol,
            "price": snap.price,
            "sma20": snap.sma20,
            "sma50": snap.sma50,
            "regime": snap.regime.value,
            "bars": snap.bars,
        }

    def snapshot(self) -> dict:
        account = self.market.account()
        stats = self.ledger.stats()
        return {
            "account": account.model_dump(),
            "clock": self.market.clock().model_dump(),
            "stats": stats,
            "universe": self.settings.universe,
            "kill_switch": self.settings.tradenum_kill_switch,
            "limits": {
                "max_loss_per_ticket": self.settings.tradenum_max_loss_per_ticket,
                "min_credit": self.settings.tradenum_min_credit,
            },
            "tickets": [t.model_dump(mode="json") for t in self.ledger.all()],
        }

    def heartbeat(self, execute: bool = True) -> dict:
        supervised = self.supervise_open()
        scanned = self.scan_once(execute=execute)
        data = self.snapshot()
        data["scanned"] = [t.id for t in scanned]
        data["supervised"] = [t.id for t in supervised]
        return data
