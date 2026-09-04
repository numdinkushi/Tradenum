"use client";

import { DollarSign, PieChart, ShieldAlert, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { signedPct, usdDelta, usdMoney } from "@/lib/format";
import type { AppState } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAPER_START = 100_000;

type Card = {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  valueClass: string;
  iconClass: string;
  featured?: boolean;
};

function pnlTone(n: number) {
  if (n > 0) return "text-cyan-300";
  if (n < 0) return "text-rose-400";
  return "text-white/90";
}

export function KpiStrip({ state }: { state: AppState }) {
  const equity = state.account.equity;
  const last = state.account.last_equity;
  const sessionPnl = last != null ? equity - last : null;
  const sessionPct = last && last !== 0 && sessionPnl != null ? (sessionPnl / last) * 100 : null;
  const paperReturn = equity - PAPER_START;
  const paperPct = PAPER_START ? (paperReturn / PAPER_START) * 100 : 0;
  const lossCap = state.limits?.max_loss_per_ticket ?? 750;

  const cards: Card[] = [
    {
      key: "equity",
      label: "Paper equity",
      value: usdMoney(equity),
      hint: state.account.live_broker ? "Alpaca paper account" : "Demo account",
      icon: DollarSign,
      valueClass: "text-cyan-300",
      iconClass: "text-cyan-400",
      featured: true,
    },
    {
      key: "session",
      label: "Session P&L",
      value: sessionPnl == null ? "—" : usdDelta(sessionPnl),
      hint: sessionPct == null ? "No prior close" : `${signedPct(sessionPct)} vs last close`,
      icon: TrendingUp,
      valueClass: sessionPnl == null ? "text-white/50" : pnlTone(sessionPnl),
      iconClass: sessionPnl != null && sessionPnl < 0 ? "text-rose-400" : "text-cyan-400",
    },
    {
      key: "return",
      label: "Paper return",
      value: usdDelta(paperReturn),
      hint: `${signedPct(paperPct)} vs $100k start`,
      icon: PieChart,
      valueClass: pnlTone(paperReturn),
      iconClass: paperReturn < 0 ? "text-rose-400" : "text-cyan-400",
    },
    {
      key: "cash",
      label: "Cash / buying power",
      value: usdMoney(state.account.cash),
      hint: `${usdMoney(state.account.buying_power)} available`,
      icon: Wallet,
      valueClass: "text-white",
      iconClass: "text-white/70",
    },
    {
      key: "cap",
      label: "Loss cap",
      value: usdMoney(lossCap),
      hint: `${state.stats.open} open · ${state.stats.vetoed} blocked`,
      icon: ShieldAlert,
      valueClass: "text-amber-300",
      iconClass: "text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 border-b border-white/10 px-4 py-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={cn(
              "rounded-lg bg-black/40 px-3 py-2.5 ring-1 ring-white/10",
              card.featured && "ring-cyan-400/60"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-[10px] tracking-[0.16em] text-white/45 uppercase">
                {card.label}
              </p>
              <Icon className={cn("h-3.5 w-3.5 shrink-0", card.iconClass)} strokeWidth={1.75} />
            </div>
            <p className={cn("mt-1.5 font-mono text-lg leading-none tracking-tight sm:text-xl", card.valueClass)}>
              {card.value}
            </p>
            <p className="mt-1.5 font-mono text-[10px] text-white/40">{card.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
