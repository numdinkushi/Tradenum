"use client";

import type { AppState } from "@/lib/types";
import { StatusLamp } from "@/components/desk/status-lamp";

export function LampStrip({ state }: { state: AppState }) {
  const tapeLive = state.account.live_broker;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/10 px-4 py-2">
      <StatusLamp label="TAPE" value={tapeLive ? "LIVE" : "DEMO"} tone={tapeLive ? "live" : "demo"} />
      <StatusLamp label="BROKER" value={tapeLive ? "ALPACA" : "DARK"} tone={tapeLive ? "live" : "off"} />
      <StatusLamp
        label="PAPER"
        value={state.account.paper ? "ON" : "OFF"}
        tone={state.account.paper ? "live" : "warn"}
      />
      <StatusLamp
        label="GATES"
        value={state.kill_switch ? "KILL" : "CLEAR"}
        tone={state.kill_switch ? "warn" : "live"}
      />
      <span className="ml-auto font-mono text-[11px] text-white/40">
        {state.clock.is_open ? "session open" : "session closed"}
      </span>
    </div>
  );
}
