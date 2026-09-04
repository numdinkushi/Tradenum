import { Card, CardContent } from "@/components/ui/card";
import { usd } from "@/lib/format";
import type { AppState } from "@/lib/types";

const METRICS = [
  { key: "equity", label: "Fake-money balance", value: (s: AppState) => usd(s.account.equity) },
  { key: "bp", label: "Buying power", value: (s: AppState) => usd(s.account.buying_power) },
  { key: "tickets", label: "Ideas stamped", value: (s: AppState) => String(s.stats.tickets) },
  { key: "vetoed", label: "Blocked", value: (s: AppState) => String(s.stats.vetoed) },
  { key: "open", label: "Open trades", value: (s: AppState) => String(s.stats.open) },
  { key: "pnl", label: "P&L (paper)", value: (s: AppState) => usd(s.stats.realized_pnl) },
] as const;

export function MetricStrip({ state }: { state: AppState }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {METRICS.map((m) => (
        <Card key={m.key} size="sm">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="font-mono text-lg">{m.value(state)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
