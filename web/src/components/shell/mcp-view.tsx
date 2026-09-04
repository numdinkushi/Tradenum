"use client";

import { useSession } from "@/components/shell/session";

const HOOKS = [
  {
    name: "get_account_state",
    maps: "Lamps · equity · kill switch",
    body: "Alpaca paper account, clock, ledger stats, numbered tickets.",
  },
  {
    name: "get_chart",
    maps: "Play tape",
    body: "OHLC bars and regime for a universe name. Same snapshot as the candlesticks.",
  },
  {
    name: "consider_trade",
    maps: "Play · Run tape",
    body: "Propose, compile mleg, run Python gates. execute defaults false.",
  },
  {
    name: "scan_universe",
    maps: "Universe tab",
    body: "consider_trade across SPY, QQQ, IWM, AAPL, MSFT, NVDA.",
  },
  {
    name: "supervise_open",
    maps: "Watch tab",
    body: "Review open tickets. Supervisor may flatten on the same paper account.",
  },
] as const;

export function McpView() {
  const { state } = useSession();
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <p className="font-mono text-[10px] tracking-[0.22em] text-white/35">FORM CHECK</p>
      <h2 className="mt-1 text-lg text-white">Same agent. Five tools. Not a second brain.</h2>
      <p className="mt-2 max-w-2xl text-sm text-white/60">
        Hackathon surface: Alpaca Trading API and MCP. Tradenum uses both. Cursor talks to{" "}
        <span className="font-mono text-cyan-300/80">uv run tradenum-mcp</span>. The desk FastAPI is
        the same TradeNumAgent.
      </p>
      <p className="mt-3 font-mono text-[11px] text-white/45">
        paper={String(state.account.paper)} · live_broker={String(state.account.live_broker)} · kill=
        {String(state.kill_switch)}
      </p>
      <ol className="mt-6 grid max-w-3xl gap-2">
        {HOOKS.map((hook, i) => (
          <li
            key={hook.name}
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-[10px] tracking-[0.18em] text-white/35">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-[11px] text-cyan-300/80">{hook.maps}</span>
            </div>
            <p className="mt-1 font-mono text-sm text-white">{hook.name}</p>
            <p className="mt-1 text-[12px] text-white/50">{hook.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
