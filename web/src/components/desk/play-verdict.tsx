"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";

import { GATE_PLAIN } from "@/lib/copy";
import type { GateName } from "@/lib/enums";
import { playVerdict, type PrintCall, type VerdictTone } from "@/lib/play";
import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";

const TONE: Record<
  VerdictTone,
  { border: string; kicker: string; wash: string }
> = {
  idle: {
    border: "border-white/10",
    kicker: "text-white/35",
    wash: "bg-white/[0.03]",
  },
  quiet: {
    border: "border-white/15",
    kicker: "text-white/50",
    wash: "bg-white/[0.04]",
  },
  blocked: {
    border: "border-red-500/50",
    kicker: "text-red-400",
    wash: "bg-red-500/[0.07]",
  },
  clear: {
    border: "border-cyan-400/40",
    kicker: "text-cyan-300",
    wash: "bg-cyan-400/[0.07]",
  },
};

type Pos = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function PlayVerdict({
  ticket,
  printCall,
  sending,
  onSend,
}: {
  ticket: Ticket | null;
  printCall: PrintCall | null;
  sending?: boolean;
  onSend?: (override: boolean) => void;
}) {
  const v = playVerdict(ticket, printCall);
  const tone = TONE[v.tone];
  const cardRef = useRef<HTMLElement>(null);
  const drag = useRef<{ pointer: number; origin: Pos; start: Pos } | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (v.tone === "idle") return;
    setCollapsed(false);
  }, [ticket?.id, v.tone]);

  const keepInBounds = useCallback((next: Pos): Pos => {
    const el = cardRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return next;
    return {
      x: clamp(next.x, 8, Math.max(8, parent.clientWidth - el.offsetWidth - 8)),
      y: clamp(next.y, 8, Math.max(8, parent.clientHeight - el.offsetHeight - 8)),
    };
  }, []);

  const settle = useCallback(() => {
    setPos((prev) => {
      if (!prev) return prev;
      const next = keepInBounds(prev);
      return next.x === prev.x && next.y === prev.y ? prev : next;
    });
  }, [keepInBounds]);

  useLayoutEffect(() => {
    settle();
  }, [collapsed, settle]);

  useEffect(() => {
    window.addEventListener("resize", settle);
    return () => window.removeEventListener("resize", settle);
  }, [settle]);

  function currentOffset(): Pos {
    const el = cardRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return pos ?? { x: 8, y: 12 };
    const rect = el.getBoundingClientRect();
    const host = parent.getBoundingClientRect();
    return { x: rect.left - host.left, y: rect.top - host.top };
  }

  function onHeaderPointerDown(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    const start = currentOffset();
    drag.current = {
      pointer: e.pointerId,
      origin: { x: e.clientX, y: e.clientY },
      start,
    };
    setPos(start);
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onHeaderPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointer !== e.pointerId) return;
    e.stopPropagation();
    setPos(
      keepInBounds({
        x: drag.current.start.x + (e.clientX - drag.current.origin.x),
        y: drag.current.start.y + (e.clientY - drag.current.origin.y),
      })
    );
  }

  function onHeaderPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
  }

  return (
    <aside
      ref={cardRef}
      role="dialog"
      aria-label="Play verdict"
      aria-expanded={!collapsed}
      style={pos ? { top: pos.y, left: pos.x } : { top: 12, right: 12 }}
      className={cn(
        "pointer-events-auto absolute z-20 flex w-80 flex-col overflow-hidden rounded-md border shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
        tone.border,
        tone.wash,
        "backdrop-blur-sm",
        collapsed ? "max-h-none" : "max-h-[min(28rem,calc(100%-1.5rem))]"
      )}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "flex touch-none items-center gap-2 border-b border-white/10 px-2 py-1.5 select-none",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
      >
        <span className="font-mono text-[10px] tracking-[0.22em] text-white/40">GATE LEDGER</span>
        {collapsed && v.symbol ? (
          <span className="truncate font-mono text-[11px] text-white/80">{v.symbol}</span>
        ) : null}
        <span className={cn("font-mono text-[10px] tracking-[0.22em]", tone.kicker)}>{v.kicker}</span>
        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <HeaderButton
            disabled={collapsed}
            onClick={() => setCollapsed(true)}
          >
            Collapse
          </HeaderButton>
          <HeaderButton
            disabled={!collapsed}
            onClick={() => setCollapsed(false)}
          >
            Expand
          </HeaderButton>
        </div>
      </div>

      {!collapsed ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {v.symbol ? (
            <p className="font-mono text-lg tracking-tight text-white">{v.symbol}</p>
          ) : null}
          <p className={cn("text-sm font-medium", v.symbol ? "mt-0.5 text-white/90" : "text-white")}>
            {v.title}
          </p>
          <p className="mt-1 text-[12px] leading-snug text-white/50">{v.subtitle}</p>

          {v.council.length ? (
            <ol className="mt-3 space-y-1">
              {v.council.map((row) => (
                <li
                  key={`${row.kicker}-${row.name}`}
                  className={cn(
                    "rounded border px-2 py-1.5",
                    row.mark === "FAIL" && "border-red-500/25 bg-black/25",
                    row.mark === "PASS" && "border-white/8 bg-black/15",
                    row.mark === "SKIP" && "border-white/8 opacity-70",
                    (row.mark === "HELD" || row.mark === "SENT") && "border-cyan-400/20 bg-black/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] tracking-[0.12em] text-white/55">
                      <span className="text-white/30">{row.kicker}</span> {row.name}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[10px] tracking-[0.14em]",
                        row.mark === "FAIL" && "text-red-400",
                        row.mark === "PASS" && "text-cyan-300",
                        row.mark === "SENT" && "text-cyan-300",
                        row.mark === "HELD" && "text-amber-300",
                        row.mark === "SKIP" && "text-white/30"
                      )}
                    >
                      {row.mark}
                    </span>
                  </div>
                  {row.detail ? (
                    <p className="mt-1 font-mono text-[11px] leading-snug text-white/70">{row.detail}</p>
                  ) : null}
                  {row.mark === "FAIL" ? (
                    <p className="mt-0.5 text-[11px] leading-snug text-white/40">
                      {GATE_PLAIN[row.name as GateName] ?? ""}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}

          {v.figures.length ? (
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/10 pt-3">
              {v.figures.map((f) => (
                <div key={f.label}>
                  <dt className="font-mono text-[9px] tracking-[0.16em] text-white/35">{f.label}</dt>
                  <dd className="font-mono text-[12px] text-white/85">{f.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {v.ledger.length ? (
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="font-mono text-[9px] tracking-[0.22em] text-white/30">LEDGER</p>
              <ul className="mt-1 space-y-0.5">
                {v.ledger.map((s, i) => (
                  <li key={`${s.line}-${i}`} className="font-mono text-[10px] text-white/45">
                    {s.line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {onSend && ticket ? <SendControl ticket={ticket} sending={!!sending} onSend={onSend} /> : null}
        </div>
      ) : null}
    </aside>
  );
}

function SendControl({
  ticket,
  sending,
  onSend,
}: {
  ticket: Ticket;
  sending: boolean;
  onSend: (override: boolean) => void;
}) {
  const mode = sendMode(ticket);
  if (!mode) return null;
  const hard = ticket.gates.some((g) => !g.passed && HARD_SEND.has(g.name));
  if (hard) {
    return (
      <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-snug text-white/40">
        This block is geometry (paper, kill, hedge, or leg count). The desk will not send it.
      </p>
    );
  }
  const override = mode === "override";
  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <p className="text-[11px] leading-snug text-white/45">
        {override
          ? "Gates stay FAIL on the ledger. This POSTs the compiled paper mleg anyway."
          : "Gates cleared. Arm was off — send this compiled mleg to Alpaca paper."}
      </p>
      <button
        type="button"
        disabled={sending}
        onClick={() => onSend(override)}
        className={cn(
          "mt-2 w-full rounded px-2 py-1.5 font-mono text-[10px] tracking-[0.16em] uppercase",
          sending
            ? "bg-white/10 text-white/30"
            : override
              ? "bg-amber-300 text-black hover:bg-amber-200"
              : "bg-cyan-400 text-black hover:bg-cyan-300"
        )}
      >
        {sending ? "Sending…" : override ? "Override & send paper" : "Send paper mleg"}
      </button>
    </div>
  );
}

const HARD_SEND = new Set(["paper_only", "kill_switch", "defined_risk", "leg_count"]);

function sendMode(ticket: Ticket): "send" | "override" | null {
  if (ticket.status === "proposed") return "send";
  if (ticket.status === "vetoed") return "override";
  if (ticket.status === "failed") {
    return ticket.gates.some((g) => !g.passed) ? "override" : "send";
  }
  return null;
}

function HeaderButton({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] uppercase shrink-0",
        disabled
          ? "text-white/20"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
