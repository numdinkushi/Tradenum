"use client";

import { useMemo, useState } from "react";

import { TicketRow } from "@/components/shell/ticket-row";
import { useSession } from "@/components/shell/session";
import { stampTime } from "@/lib/format";

export function LedgerView() {
  const { state } = useSession();
  const tickets = state.tickets;
  const [focusId, setFocusId] = useState<string | null>(tickets[0]?.id ?? null);
  const focus = useMemo(
    () => tickets.find((t) => t.id === focusId) ?? tickets[0] ?? null,
    [focusId, tickets]
  );
  const vetoPct = Math.round((state.stats.veto_rate ?? 0) * 100);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-h-0 overflow-y-auto border-b border-white/10 p-4 lg:border-b-0 lg:border-r">
        <p className="font-mono text-[10px] tracking-[0.22em] text-white/35">NUMBERED TICKETS</p>
        <p className="mt-1 text-sm text-white/70">
          {state.stats.tickets} stamped · {state.stats.vetoed} blocked · {vetoPct}% veto rate.
          Passing is kept. That is the product.
        </p>
        <div className="mt-4 grid gap-2">
          {tickets.length ? (
            tickets.map((ticket) => (
              <TicketRow
                key={ticket.id}
                ticket={ticket}
                selected={focus?.id === ticket.id}
                onSelect={() => setFocusId(ticket.id)}
              />
            ))
          ) : (
            <p className="text-sm text-white/40">Run the play or scan the universe. TN-0001 lands here.</p>
          )}
        </div>
      </div>
      <div className="min-h-0 overflow-y-auto p-4">
        <p className="font-mono text-[10px] tracking-[0.22em] text-white/35">MLEG PAYLOAD</p>
        {focus ? (
          <>
            <p className="mt-2 font-mono text-sm text-white">
              {focus.id} · {focus.status}
            </p>
            <p className="mt-1 text-[12px] text-white/50">{focus.proposal.thesis}</p>
            <pre className="mt-3 overflow-x-auto rounded-md border border-white/10 bg-black/30 p-3 font-mono text-[11px] text-white/70">
              {focus.order_payload
                ? JSON.stringify(focus.order_payload, null, 2)
                : "No compiled payload."}
            </pre>
            {focus.events?.length ? (
              <ul className="mt-4 space-y-1">
                <p className="font-mono text-[10px] tracking-[0.22em] text-white/35">STAMPS</p>
                {focus.events.map((ev, i) => (
                  <li key={`${ev.at}-${i}`} className="font-mono text-[11px] text-white/50">
                    <span className="text-white/30">{stampTime(ev.at) ?? ev.at}</span>
                    {" · "}
                    {ev.event}
                    {typeof ev.reason === "string" ? ` · ${ev.reason}` : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="mt-2 text-sm text-white/40">Select a ticket to read the compiled Alpaca mleg.</p>
        )}
      </div>
    </div>
  );
}
