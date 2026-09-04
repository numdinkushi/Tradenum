"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import type { AppState } from "@/lib/types";

const EMPTY: AppState = {
  account: { equity: 0, cash: 0, buying_power: 0, paper: true, live_broker: false },
  clock: { is_open: false, timestamp: "" },
  stats: { tickets: 0, vetoed: 0, open: 0, closed: 0, realized_pnl: 0, veto_rate: 0 },
  universe: ["NVDA", "AAPL", "MSFT", "SPY", "QQQ", "IWM"],
  kill_switch: false,
  limits: { max_loss_per_ticket: 750, min_credit: 0.25 },
  tickets: [],
};

type Session = {
  state: AppState;
  setState: (next: AppState) => void;
  refresh: () => Promise<void>;
  armed: boolean;
  setArmed: (next: boolean) => void;
  jobBusy: boolean;
  error: string | null;
  setError: (next: string | null) => void;
  scanUniverse: () => Promise<void>;
  superviseOpen: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

function failMessage(err: unknown, fallback: string) {
  if (err instanceof TypeError) return "Couldn't reach the agent API.";
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY);
  const [armed, setArmed] = useState(false);
  const [jobBusy, setJobBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await api.state();
    setState(next);
  }, []);

  useEffect(() => {
    refresh().catch((err: unknown) => {
      const message = failMessage(err, "Couldn't load account state.");
      setError(message);
      toast(message);
    });
    const id = window.setInterval(() => {
      refresh().catch(() => {});
    }, 20_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const scanUniverse = useCallback(async () => {
    setJobBusy(true);
    setError(null);
    try {
      const result = await api.scan(armed);
      setState(result.state);
      toast(
        result.ids.length
          ? `Universe scan stamped ${result.ids.length} ticket(s).`
          : "Universe scan: every name passed. Most flow is junk."
      );
    } catch (err: unknown) {
      const message = failMessage(err, "Universe scan failed.");
      setError(message);
      toast(message);
    } finally {
      setJobBusy(false);
    }
  }, [armed]);

  const superviseOpen = useCallback(async () => {
    setJobBusy(true);
    setError(null);
    try {
      const result = await api.supervise();
      setState(result.state);
      toast(
        result.ids.length
          ? `Reviewed ${result.ids.length} open ticket(s).`
          : "No open paper risk to review."
      );
    } catch (err: unknown) {
      const message = failMessage(err, "Supervise failed.");
      setError(message);
      toast(message);
    } finally {
      setJobBusy(false);
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{
        state,
        setState,
        refresh,
        armed,
        setArmed,
        jobBusy,
        error,
        setError,
        scanUniverse,
        superviseOpen,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider.");
  return value;
}
