"""MCP wrap of the same TradeNumAgent the desk API uses.

Hackathon form check: Alpaca Trading API plus MCP (or CLI). This is that MCP.
It does not reimplement strategy, gates, or mleg compile — it calls TradeNumAgent.
"""

from __future__ import annotations

import argparse
from typing import Any

from mcp.server.mcpserver import MCPServer

from tradenum.agent import TradeNumAgent
from tradenum.domain.models import Ticket

TOOL_NAMES = (
    "get_account_state",
    "get_chart",
    "consider_trade",
    "scan_universe",
    "supervise_open",
)


def _ticket_json(ticket: Ticket | None) -> dict[str, Any] | None:
    if ticket is None:
        return None
    return ticket.model_dump(mode="json")


class TradeNumTools:
    """Plain helpers so tests can call tools without a protocol session."""

    def __init__(self, agent: TradeNumAgent) -> None:
        self.agent = agent

    def get_account_state(self) -> dict[str, Any]:
        return self.agent.snapshot()

    def get_chart(self, symbol: str) -> dict[str, Any]:
        return self.agent.chart(symbol.upper())

    def consider_trade(self, symbol: str, execute: bool = False) -> dict[str, Any]:
        ticket = self.agent.consider(symbol.upper(), execute=execute)
        return {"ticket": _ticket_json(ticket)}

    def scan_universe(self, execute: bool = False) -> dict[str, Any]:
        tickets = self.agent.scan_once(execute=execute)
        return {
            "ids": [t.id for t in tickets],
            "tickets": [_ticket_json(t) for t in tickets],
        }

    def supervise_open(self) -> dict[str, Any]:
        tickets = self.agent.supervise_open()
        return {
            "ids": [t.id for t in tickets],
            "tickets": [_ticket_json(t) for t in tickets],
        }


def create_server(agent: TradeNumAgent | None = None) -> MCPServer:
    tools = TradeNumTools(agent or TradeNumAgent())
    mcp = MCPServer(
        name="tradenum",
        title="Tradenum",
        description=(
            "Defined-risk Alpaca paper options agent. Same TradeNumAgent as the desk FastAPI. "
            "execute defaults to false (compile + gates only)."
        ),
        instructions=(
            "Tradenum watches a six-node play: scan, print, spread, gate, Alpaca mleg, supervise. "
            "Use get_account_state first. consider_trade / scan_universe leave execute=false unless "
            "you intend to POST a paper mleg. Gates can BLOCK; that is the product."
        ),
    )

    @mcp.tool(description="Alpaca paper account, clock, ledger stats, and tickets.")
    def get_account_state() -> dict[str, Any]:
        return tools.get_account_state()

    @mcp.tool(description="OHLC bars and regime for a universe ticker (SPY, QQQ, IWM, AAPL, MSFT, NVDA).")
    def get_chart(symbol: str) -> dict[str, Any]:
        return tools.get_chart(symbol)

    @mcp.tool(
        description=(
            "Propose a defined-risk options structure, compile Alpaca mleg, run Python gates. "
            "execute=false (default) stops after gates. execute=true posts paper."
        )
    )
    def consider_trade(symbol: str, execute: bool = False) -> dict[str, Any]:
        return tools.consider_trade(symbol, execute=execute)

    @mcp.tool(
        description="consider_trade across the universe. execute=false by default (no paper orders)."
    )
    def scan_universe(execute: bool = False) -> dict[str, Any]:
        return tools.scan_universe(execute=execute)

    @mcp.tool(description="Review open tickets; supervisor may flatten on the same Alpaca paper account.")
    def supervise_open() -> dict[str, Any]:
        return tools.supervise_open()

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(description="Tradenum MCP — TradeNumAgent over stdio or Streamable HTTP")
    parser.add_argument(
        "--http",
        action="store_true",
        help="Serve Streamable HTTP instead of stdio (default port 8765)",
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    server = create_server()
    if args.http:
        server.run("streamable-http", host=args.host, port=args.port)
    else:
        server.run("stdio")


if __name__ == "__main__":
    main()
