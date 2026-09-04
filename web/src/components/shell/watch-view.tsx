"use client";

import { TicketRow } from "@/components/shell/ticket-row";
import { useSession } from "@/components/shell/session";
import { Button } from "@/components/ui/button";
import { TicketStatus } from "@/lib/enums";

export function WatchView() {
  const { state, jobBusy, superviseOpen } = useSession();
  const open = state.tickets.filter(
    (t) => t.status === TicketStatus.Executed || t.status === TicketStatus.Supervising
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-white/35">OPEN PAPER RISK</p>
          <p className="mt-1 max-w-xl text-sm text-white/70">
            Node 06. The supervisor reviews live tickets on the same Alpaca paper account and may
            flatten. Empty is a valid desk — gates blocked, or arm was off.
          </p>
        </div>
        <Button
          onClick={() => void superviseOpen()}
          disabled={jobBusy}
          className="bg-white text-black hover:bg-cyan-200"
        >
          {jobBusy ? "Reviewing…" : "Review open"}
        </Button>
      </div>
      <div className="mt-6 grid max-w-2xl gap-2">
        {open.length ? (
          open.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)
        ) : (
          <p className="text-sm text-white/40">
            No live position. Arm mleg on Play, pass the gate, then Watch has something to flatten.
          </p>
        )}
      </div>
    </div>
  );
}
