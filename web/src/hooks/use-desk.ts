"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAgentBus } from "@/components/desk/room";
import { useSession } from "@/components/shell/session";
import { toast, toastConfirm } from "@/components/ui/toast";
import { api } from "@/lib/api";
import {
  deskCaption,
  PLAY_NODE_IDS,
  printCallFor,
  STRUCTURE_SHORT,
  type DeskStamp,
  type NodeRunStatus,
  type PlayNodeId,
  type PrintCall,
} from "@/lib/play";
import type { ChartState, Ticket } from "@/lib/types";

const STEP_MS = 420;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function idleStatus(): Record<PlayNodeId, NodeRunStatus> {
  return Object.fromEntries(PLAY_NODE_IDS.map((id) => [id, "idle"])) as Record<
    PlayNodeId,
    NodeRunStatus
  >;
}

function deskError(err: unknown, fallback: string) {
  if (err instanceof TypeError) return "Couldn't reach the agent API.";
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function useDesk() {
  const { broadcastStep, remoteNode } = useAgentBus();
  const { state, setState, armed } = useSession();
  const [chart, setChart] = useState<ChartState | null>(null);
  const [symbol, setSymbol] = useState("NVDA");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [active, setActive] = useState<PlayNodeId | null>(null);
  const [statuses, setStatuses] = useState<Record<PlayNodeId, NodeRunStatus>>(idleStatus);
  const [caption, setCaption] = useState(
    "Agent-authored play. Unusual prints on real names. Defined-risk options on Alpaca paper."
  );
  const [printCall, setPrintCall] = useState<PrintCall | null>(null);
  const [verdictReady, setVerdictReady] = useState(false);
  const [stamps, setStamps] = useState<DeskStamp[]>([]);
  const [quotes, setQuotes] = useState<Record<string, ChartState>>({});
  const runId = useRef(0);

  const shownActive = (busy ? active : (remoteNode as PlayNodeId | null) ?? active);

  const loadChart = useCallback(async (sym: string) => {
    const next = await api.chart(sym);
    setChart(next);
    setQuotes((prev) => ({ ...prev, [sym]: next }));
  }, []);

  useEffect(() => {
    loadChart(symbol).catch((err: unknown) => {
      const message = deskError(err, `Couldn't load tape for ${symbol}.`);
      setError(message);
      toast(message);
    });
  }, [symbol, loadChart]);

  useEffect(() => {
    const names = state.universe.length ? state.universe : ["NVDA", "AAPL", "MSFT", "SPY"];
    let cancelled = false;
    Promise.all(
      names.map(async (sym) => {
        const next = await api.chart(sym);
        return [sym, next] as const;
      })
    )
      .then((entries) => {
        if (cancelled) return;
        setQuotes(Object.fromEntries(entries));
      })
      .catch(() => {
        /* selected tape still loads on its own */
      });
    return () => {
      cancelled = true;
    };
  }, [state.universe]);

  const mark = useCallback(
    (id: PlayNodeId | null, status?: NodeRunStatus) => {
      setActive(id);
      broadcastStep(id);
      if (id && status) {
        setStatuses((prev) => ({ ...prev, [id]: status }));
      }
    },
    [broadcastStep]
  );

  const pushStamp = useCallback((kicker: string, line: string) => {
    setStamps((prev) => [...prev, { kicker, line }]);
  }, []);

  const runTape = useCallback(async () => {
    const id = ++runId.current;
    setBusy(true);
    setError(null);
    setTicket(null);
    setPrintCall(null);
    setVerdictReady(false);
    setStamps([]);
    setStatuses(idleStatus());
    setCaption(`Scanning ${symbol}…`);
    mark("scan", "active");
    pushStamp("01", `Scan ${symbol}`);

    try {
      const [chartNext, considered] = await Promise.all([
        api.chart(symbol),
        api.consider(symbol, armed),
      ]);
      if (id !== runId.current) return;
      setChart(chartNext);
      setQuotes((prev) => ({ ...prev, [symbol]: chartNext }));
      const nextTicket = considered.ticket;
      const call = printCallFor(nextTicket);
      setTicket(nextTicket);
      setPrintCall(call);
      const nextState = await api.state();
      if (id !== runId.current) return;
      setState(nextState);

      await sleep(STEP_MS);
      if (id !== runId.current) return;
      mark("scan", "passed");
      pushStamp("01", nextState.account.live_broker ? "Alpaca bars." : "Demo tape.");

      mark("print", "active");
      setCaption(
        call === "pass"
          ? `${symbol}: no print worth the spread. Passing.`
          : `${symbol}: ${call === "fade" ? "fade" : "follow"} the print.`
      );
      await sleep(STEP_MS);
      if (id !== runId.current) return;
      mark("print", call === "pass" ? "skipped" : "passed");
      pushStamp(
        "02",
        call === "pass" ? "Pass. Nothing to sell." : `${call} ${symbol}.`
      );

      if (call === "pass" || !nextTicket) {
        setStatuses((prev) => ({
          ...prev,
          structure: "skipped",
          gate: "skipped",
          execute: "skipped",
          supervise: "skipped",
        }));
        setCaption(deskCaption(null, "pass"));
        mark(null);
        await sleep(STEP_MS);
        if (id !== runId.current) return;
        setVerdictReady(true);
        return;
      }

      mark("structure", "active");
      await sleep(STEP_MS);
      if (id !== runId.current) return;
      mark("structure", "passed");
      pushStamp(
        "03",
        STRUCTURE_SHORT[nextTicket.proposal.structure] ?? nextTicket.proposal.structure
      );

      const blocked = nextTicket.status === "vetoed";
      mark("gate", "active");
      await sleep(STEP_MS);
      if (id !== runId.current) return;
      mark("gate", blocked ? "blocked" : "passed");
      pushStamp(
        "04",
        blocked
          ? nextTicket.veto_reason ?? "Gate blocked."
          : "All gates clear."
      );

      if (blocked) {
        setStatuses((prev) => ({
          ...prev,
          execute: "skipped",
          supervise: "skipped",
        }));
        setCaption(deskCaption(nextTicket, call));
        pushStamp("05", "Mleg skipped.");
        mark(null);
        await sleep(STEP_MS);
        if (id !== runId.current) return;
        setVerdictReady(true);
        return;
      }

      mark("execute", "active");
      await sleep(STEP_MS);
      if (id !== runId.current) return;
      mark("execute", "passed");
      pushStamp(
        "05",
        nextTicket.status === "executed" || nextTicket.status === "supervising"
          ? "Paper mleg posted."
          : "Compiled. Arm off."
      );

      const watching =
        nextTicket.status === "executed" || nextTicket.status === "supervising";
      mark("supervise", "active");
      await sleep(STEP_MS);
      if (id !== runId.current) return;
      mark("supervise", watching ? "passed" : "skipped");
      pushStamp("06", watching ? "Watching open risk." : "No live position.");
      setCaption(deskCaption(nextTicket, call));
      mark(null);
      await sleep(STEP_MS);
      if (id !== runId.current) return;
      setVerdictReady(true);
    } catch (err) {
      if (id !== runId.current) return;
      const message = deskError(err, "Desk failed");
      setError(message);
      toast(message);
      setCaption("Tape call failed. The desk is up — market data may have fallen back.");
      mark(null);
    } finally {
      if (id === runId.current) setBusy(false);
    }
  }, [armed, mark, pushStamp, setState, symbol]);

  const sendTicket = useCallback(
    async (override: boolean) => {
      if (!ticket) return;
      if (override) {
        const ok = await toastConfirm("Gates failed. POST this paper mleg anyway?", "POST anyway");
        if (!ok) return;
      }
      setBusy(true);
      setError(null);
      try {
        const result = await api.send(ticket.id, override);
        setTicket(result.ticket);
        setState(result.state);
        const watching =
          result.ticket.status === "executed" || result.ticket.status === "supervising";
        setStatuses((prev) => ({
          ...prev,
          execute: watching ? "passed" : result.ticket.status === "failed" ? "blocked" : prev.execute,
          supervise: watching ? "passed" : prev.supervise,
        }));
        pushStamp("05", override ? "Human override. Paper mleg posted." : "Paper mleg posted.");
        setCaption(
          watching
            ? `${result.ticket.proposal.underlying}: paper mleg posted.`
            : deskCaption(result.ticket, printCallFor(result.ticket))
        );
        toast(
          watching
            ? override
              ? "Override stamped. Paper mleg posted."
              : "Paper mleg posted."
            : result.ticket.veto_reason ?? "Send failed."
        );
      } catch (err) {
        const message = deskError(err, "Send failed.");
        setError(message);
        toast(message);
      } finally {
        setBusy(false);
      }
    },
    [pushStamp, setState, ticket]
  );

  const strikes = useMemo(() => {
    const structureLit =
      statuses.structure === "active" ||
      statuses.structure === "passed" ||
      statuses.structure === "blocked";
    if (!structureLit) return [];
    return (ticket?.proposal.legs ?? [])
      .map((leg) => leg.strike)
      .filter((n): n is number => typeof n === "number");
  }, [statuses.structure, ticket]);

  return {
    state,
    chart,
    quotes,
    symbol,
    setSymbol,
    busy,
    error,
    ticket,
    active: shownActive,
    statuses,
    caption,
    printCall,
    verdictReady,
    stamps,
    strikes,
    sending: busy,
    runTape,
    sendTicket,
  };
}
