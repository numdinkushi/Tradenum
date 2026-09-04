# Tradenum

Unusual options prints on real stocks. An agent that trades a defined-risk version on Alpaca paper.

You watch a candlestick tape and a **locked six-node play**. The agent authors the graph. You do not wire RSI boxes. One broker. Options only. Gates are nodes — if they block, the graph stops in public.

```
Scan tape → Unusual print → Build spread → Risk gate → Alpaca mleg → Supervise
```

Prints are **follow**, **fade**, or **pass**. Most flow is junk. Passing is a first-class outcome.

## Layout

```
src/tradenum/     FastAPI agent, gates, Alpaca mleg, MCP
web/              Tradenum desk (chart + React Flow play)
```

## Run

```bash
cp .env.example .env
uv sync --extra dev
uv run pytest
uv run tradenum-api          # http://127.0.0.1:8000
cd web && npm install && npm run dev   # http://localhost:3000
```

## MCP (hackathon form check)

Required surface: Alpaca Trading API **and** MCP or CLI. Tradenum uses both.

The MCP server is the **same** `TradeNumAgent` as FastAPI — not a second strategy. `execute` defaults to **false** (compile + gates only).

```bash
uv run tradenum-mcp              # stdio (Cursor / Claude Desktop)
uv run tradenum-mcp --http       # Streamable HTTP at http://127.0.0.1:8765/mcp
uv run tradenum scan --dry-run   # CLI, same agent
```

Project `.mcp.json` points Cursor at `uv run tradenum-mcp`. Tools: `get_account_state`, `get_chart`, `consider_trade`, `scan_universe`, `supervise_open`.

Optional Liveblocks keys live in `web/.env.local` so a second window can watch the same run. The graph is not a collaborative editor.

Practice mode is on by default (checklist only, no orders).
