"use client";

import { useState } from "react";

import { Desk } from "@/components/desk/desk";
import { KpiStrip } from "@/components/shell/kpi-strip";
import { LampStrip } from "@/components/shell/lamp-strip";
import { LedgerView } from "@/components/shell/ledger-view";
import { McpView } from "@/components/shell/mcp-view";
import { useSession } from "@/components/shell/session";
import { SHELL_TABS, type ShellTab } from "@/components/shell/tabs";
import { UniverseView } from "@/components/shell/universe-view";
import { WatchView } from "@/components/shell/watch-view";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function AppShell() {
  const [tab, setTab] = useState<ShellTab>("play");
  const s = useSession();
  const active = SHELL_TABS.find((t) => t.id === tab)!;

  function armMleg(next: boolean) {
    s.setArmed(next);
    toast(
      next
        ? "Armed. Passing gates will POST a paper mleg."
        : "Disarmed. Gates still run. No order."
    );
  }

  return (
    <main className="flex h-dvh flex-col bg-[#05060a] text-white">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="mr-2">
          <p className="font-mono text-[10px] tracking-[0.28em] text-cyan-300/80">TRADENUM</p>
          <h1 className="text-sm font-medium text-white/90">
            Unusual prints. Defined-risk options. One broker.
          </h1>
        </div>
        <nav className="flex flex-wrap gap-1">
          {SHELL_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded px-2.5 py-1 font-mono text-[11px] tracking-[0.12em] transition-colors",
                tab === item.id
                  ? "bg-cyan-400 text-black"
                  : "text-white/55 hover:bg-white/10 hover:text-white"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 font-mono text-[11px] text-white/50">
            <Switch checked={s.armed} onCheckedChange={armMleg} />
            <span className={s.armed ? "text-amber-300" : "text-white/50"}>
              {s.armed ? "Armed" : "Arm mleg"}
            </span>
          </label>
        </div>
      </header>
      <p className="border-b border-white/10 px-4 py-1.5 font-mono text-[10px] tracking-[0.16em] text-white/35">
        ONE AGENT · FIVE SURFACES · {active.kicker} {active.blurb.toUpperCase()}
      </p>
      <LampStrip state={s.state} />
      <KpiStrip state={s.state} />
      <div className={cn("min-h-0 flex-1 flex-col", tab === "play" ? "flex" : "hidden")}>
        <Desk />
      </div>
      {tab === "ledger" ? <LedgerView /> : null}
      {tab === "universe" ? <UniverseView /> : null}
      {tab === "watch" ? <WatchView /> : null}
      {tab === "mcp" ? <McpView /> : null}
    </main>
  );
}
