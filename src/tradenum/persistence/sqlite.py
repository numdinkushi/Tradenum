from __future__ import annotations

import sqlite3
from pathlib import Path

from tradenum.domain.constants import TICKET_PAD, TICKET_PREFIX
from tradenum.domain.models import Ticket
from tradenum.utils.options import format_ticket_id, parse_ticket_seq
from tradenum.utils.time import utcnow


class SqliteLedger:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._init()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS tickets (
                    id TEXT PRIMARY KEY,
                    seq INTEGER NOT NULL,
                    payload TEXT NOT NULL,
                    status TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.execute("CREATE TABLE IF NOT EXISTS seq (name TEXT PRIMARY KEY, value INTEGER NOT NULL)")
            conn.execute("INSERT OR IGNORE INTO seq(name, value) VALUES ('ticket', 0)")

    def next_id(self) -> str:
        with self._connect() as conn:
            row = conn.execute("SELECT value FROM seq WHERE name = 'ticket'").fetchone()
            nxt = int(row["value"]) + 1
            conn.execute("UPDATE seq SET value = ? WHERE name = 'ticket'", (nxt,))
            return format_ticket_id(nxt, TICKET_PREFIX, TICKET_PAD)

    def save(self, ticket: Ticket) -> Ticket:
        ticket.updated_at = utcnow()
        seq = parse_ticket_seq(ticket.id)
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO tickets(id, seq, payload, status, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    payload = excluded.payload,
                    status = excluded.status,
                    updated_at = excluded.updated_at
                """,
                (ticket.id, seq, ticket.model_dump_json(), ticket.status.value, ticket.updated_at.isoformat()),
            )
        return ticket

    def get(self, ticket_id: str) -> Ticket | None:
        with self._connect() as conn:
            row = conn.execute("SELECT payload FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        return Ticket.model_validate_json(row["payload"]) if row else None

    def all(self) -> list[Ticket]:
        with self._connect() as conn:
            rows = conn.execute("SELECT payload FROM tickets ORDER BY seq DESC").fetchall()
        return [Ticket.model_validate_json(r["payload"]) for r in rows]

    def open(self) -> list[Ticket]:
        return [t for t in self.all() if t.status.is_live]

    def stats(self) -> dict:
        tickets = self.all()
        vetoed = [t for t in tickets if t.status.value == "vetoed"]
        closed = [t for t in tickets if t.status.value == "closed"]
        return {
            "tickets": len(tickets),
            "vetoed": len(vetoed),
            "open": len(self.open()),
            "closed": len(closed),
            "realized_pnl": sum(t.realized_pnl or 0 for t in closed),
            "veto_rate": (len(vetoed) / len(tickets)) if tickets else 0.0,
        }
