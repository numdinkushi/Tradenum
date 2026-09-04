"use client";

import { Group, Panel, Separator } from "react-resizable-panels";

import { PlayCanvas } from "@/components/desk/play-canvas";
import { TapeChart } from "@/components/desk/tape-chart";
import { Button } from "@/components/ui/button";
import { useDesk } from "@/hooks/use-desk";
import { barChangePct, signedPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Desk() {
  const d = useDesk();
  const tickers = d.state.universe.length ? d.state.universe : ["NVDA", "AAPL", "MSFT", "SPY"];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2">
        <div className="flex flex-wrap gap-1">
          {tickers.map((sym) => {
            const quote = d.quotes[sym];
            const ch = quote ? barChangePct(quote.bars) : null;
            return (
              <Button
                key={sym}
                size="sm"
                variant={d.symbol === sym ? "default" : "ghost"}
                className={cn(
                  "h-auto flex-col items-start gap-0 px-2 py-1 font-mono",
                  d.symbol === sym
                    ? "bg-cyan-400 text-black hover:bg-cyan-300"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
                onClick={() => d.setSymbol(sym)}
              >
                <span>{sym}</span>
                {quote ? (
                  <span
                    className={cn(
                      "text-[9px] tracking-normal",
                      d.symbol === sym ? "text-black/60" : "text-white/40"
                    )}
                  >
                    {quote.price.toFixed(2)}
                    {ch != null ? (
                      <span
                        className={cn(
                          "ml-1",
                          d.symbol === sym
                            ? "text-black/70"
                            : ch >= 0
                              ? "text-emerald-400"
                              : "text-rose-400"
                        )}
                      >
                        {signedPct(ch)}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </Button>
            );
          })}
        </div>
        <div className="ml-auto">
          <Button
            onClick={d.runTape}
            disabled={d.busy}
            className="bg-white text-black hover:bg-cyan-200"
          >
            {d.busy ? "Running…" : "Run tape"}
          </Button>
        </div>
      </div>

      <Group orientation="horizontal" className="min-h-0 flex-1">
        <Panel defaultSize="56" minSize="36" className="min-w-0">
          <TapeChart chart={d.chart} strikes={d.strikes} />
        </Panel>
        <Separator className="w-px bg-white/10" />
        <Panel defaultSize="44" minSize="32" className="min-w-0">
          <PlayCanvas
            statuses={d.statuses}
            active={d.active}
            ticket={d.ticket}
            printCall={d.printCall}
            verdictReady={d.verdictReady}
            stamps={d.stamps}
            sending={d.sending}
            onSend={d.sendTicket}
          />
        </Panel>
      </Group>

      <footer className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-2.5">
        <p className="truncate font-mono text-[12px] text-white/55">{d.caption}</p>
        {d.error ? (
          <p className="shrink-0 font-mono text-[11px] text-rose-400">{d.error}</p>
        ) : (
          <p className="shrink-0 font-mono text-[10px] tracking-[0.16em] text-white/30">
            SIX NODES · ALPACA ONLY · GATES ARE GEOMETRY
          </p>
        )}
      </footer>
    </div>
  );
}
