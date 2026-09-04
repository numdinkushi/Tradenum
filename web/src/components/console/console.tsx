"use client";

import { Ledger } from "@/components/console/ledger";
import { MetricStrip } from "@/components/console/metric-strip";
import { PayloadViewer } from "@/components/console/payload-viewer";
import { PipelineSteps } from "@/components/console/pipeline-steps";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTradenum } from "@/hooks/use-tradenum";

export function Console() {
  const t = useTradenum();
  const focus = t.state.tickets[0] ?? null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <p className="font-mono text-xs text-muted-foreground">TradeNum</p>
        <h1 className="text-3xl font-medium tracking-tight">Numbered tickets. Python gates. Alpaca paper.</h1>
        <p className="max-w-2xl text-muted-foreground">
          A fake-money options robot. It suggests a limited-risk spread, runs a checklist, then either
          blocks the idea or sends <span className="font-mono">POST /v2/orders</span> as a multi-leg order.
        </p>
      </header>

      <PipelineSteps />
      <MetricStrip state={t.state} />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={t.armed} onCheckedChange={t.setArmed} />
          {t.armed ? "Armed — will post paper mleg" : "Arm mleg"}
        </label>
        <div className="flex flex-wrap gap-1">
          {t.state.universe.map((sym) => (
            <Button
              key={sym}
              size="sm"
              variant={t.symbol === sym ? "default" : "outline"}
              onClick={() => t.setSymbol(sym)}
            >
              {sym}
            </Button>
          ))}
        </div>
        <Button onClick={t.consider} disabled={t.busy}>
          Show me one ticket
        </Button>
        <Button variant="outline" onClick={t.scan} disabled={t.busy}>
          Scan all
        </Button>
        <Button variant="ghost" onClick={t.supervise} disabled={t.busy}>
          Watch open trades
        </Button>
      </div>

      {t.error ? (
        <p className="text-sm text-destructive">
          {t.error}. Start the API with <span className="font-mono">uv run tradenum-api</span>.
        </p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {t.state.account.live_broker ? "Alpaca paper connected" : "Demo prices — no API keys yet"} · market{" "}
        {t.state.clock.is_open ? "open" : "closed"} · block rate {(t.state.stats.veto_rate * 100).toFixed(0)}%
      </p>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Ledger tickets={t.state.tickets} />
        <PayloadViewer payload={focus?.order_payload ?? null} />
      </section>
    </main>
  );
}
