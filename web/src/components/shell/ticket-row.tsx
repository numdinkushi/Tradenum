"use client";

import { stampTime } from "@/lib/format";
import { printCallFor, STRUCTURE_SHORT, ticketMark } from "@/lib/play";
import type { Ticket } from "@/lib/types";
import { cn } from "@/lib/utils";

const MARK_TONE: Record<string, string> = {
  BLOCK: "text-red-400",
  SENT: "text-cyan-300",
  HELD: "text-amber-300",
  FAIL: "text-red-400",
  PASS: "text-white/50",
};

export function TicketRow({
  ticket,
  selected,
  onSelect,
}: {
  ticket: Ticket;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const mark = ticketMark(ticket);
  const call = printCallFor(ticket);
  const p = ticket.proposal;
  const created = stampTime(ticket.created_at ?? ticket.events?.[0]?.at);
  const lastEvent = ticket.events?.length ? ticket.events[ticket.events.length - 1] : null;
  const lastAt = stampTime(lastEvent?.at ?? ticket.updated_at);
  const showUpdated = lastAt && lastAt !== created;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-md border px-3 py-2.5 text-left transition-colors",
        selected ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"
      )}
    >
      <div className="flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.14em]">
        <span className="text-white/40">{ticket.id}</span>
        <span className={MARK_TONE[mark]}>{mark}</span>
      </div>
      <p className="mt-1 font-mono text-sm text-white">
        {p.underlying} · {STRUCTURE_SHORT[p.structure] ?? p.structure}
      </p>
      <p className="mt-0.5 text-[11px] text-white/45">
        {call.toUpperCase()} · {p.dte} DTE · credit {p.credit ?? "—"}
      </p>
      {created ? (
        <p className="mt-1 font-mono text-[10px] tracking-normal text-white/35">
          {created}
          {showUpdated && lastEvent ? ` · ${lastEvent.event} ${lastAt}` : ""}
        </p>
      ) : null}
      {ticket.veto_reason ? (
        <p className="mt-1 font-mono text-[11px] text-red-300/90">{ticket.veto_reason}</p>
      ) : null}
    </button>
  );
}
