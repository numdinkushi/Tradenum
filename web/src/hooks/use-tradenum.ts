"use client";

import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { AppState } from "@/lib/types";

const EMPTY: AppState = {
  account: { equity: 0, cash: 0, buying_power: 0, paper: true, live_broker: false },
  clock: { is_open: false, timestamp: "" },
  stats: { tickets: 0, vetoed: 0, open: 0, closed: 0, realized_pnl: 0, veto_rate: 0 },
  universe: [],
  kill_switch: false,
  limits: { max_loss_per_ticket: 750, min_credit: 0.25 },
  tickets: [],
};

export function useTradenum() {
  const [state, setState] = useState<AppState>(EMPTY);
  const [symbol, setSymbol] = useState("SPY");
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await api.state();
    setState(next);
  }, []);

  useEffect(() => {
    refresh().catch((err: Error) => setError(err.message));
  }, [refresh]);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  return {
    state,
    symbol,
    setSymbol,
    armed,
    setArmed,
    busy,
    error,
    consider: () => run(() => api.consider(symbol, armed)),
    scan: () => run(() => api.scan(armed)),
    supervise: () => run(() => api.supervise()),
  };
}
