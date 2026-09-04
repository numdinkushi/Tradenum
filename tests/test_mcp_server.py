import asyncio
from pathlib import Path

from tradenum.agent import TradeNumAgent
from tradenum.config import Settings
from tradenum.market.demo import DemoMarket
from tradenum.mcp_server import TOOL_NAMES, TradeNumTools, create_server
from tradenum.persistence.sqlite import SqliteLedger


def _agent(tmp_path: Path) -> TradeNumAgent:
    settings = Settings(alpaca_paper_trade=True, tradenum_kill_switch=False)
    settings.tradenum_ledger_path = tmp_path / "mcp.db"
    return TradeNumAgent(settings=settings, market=DemoMarket(), ledger=SqliteLedger(settings.tradenum_ledger_path))


def test_mcp_lists_form_check_tools(tmp_path: Path) -> None:
    server = create_server(_agent(tmp_path))
    listed = asyncio.run(server.list_tools())
    names = {tool.name for tool in listed}
    assert names == set(TOOL_NAMES)
    consider = next(t for t in listed if t.name == "consider_trade")
    props = consider.input_schema.get("properties", {})
    assert "symbol" in props
    assert "execute" in props


def test_tool_helpers_dry_run_does_not_submit(tmp_path: Path) -> None:
    tools = TradeNumTools(_agent(tmp_path))
    state = tools.get_account_state()
    assert state["account"]["paper"] is True
    assert state["kill_switch"] is False
    assert state["limits"]["max_loss_per_ticket"] == 750

    chart = tools.get_chart("nvda")
    assert chart["symbol"] == "NVDA"
    assert chart["bars"]

    result = tools.consider_trade("SPY", execute=False)
    ticket = result["ticket"]
    assert ticket is not None
    assert ticket["order_payload"] is not None
    assert ticket["status"] != "supervising"
    assert ticket.get("alpaca_order_id") in (None, "")

    scanned = tools.scan_universe(execute=False)
    assert "ids" in scanned
    supervised = tools.supervise_open()
    assert supervised["ids"] == []


def test_call_tool_without_protocol_session(tmp_path: Path) -> None:
    server = create_server(_agent(tmp_path))
    result = asyncio.run(server.call_tool("get_chart", {"symbol": "SPY"}))
    text = result.content[0].text
    assert "SPY" in text
    assert "bars" in text
