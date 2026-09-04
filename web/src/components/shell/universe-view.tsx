"use client";

import { TicketRow } from "@/components/shell/ticket-row";
import { useSession } from "@/components/shell/session";
import { Button } from "@/components/ui/button";
import { printCallFor, ticketMark } from "@/lib/play";

export function UniverseView() {
  const { state, armed, jobBusy, scanUniverse } = useSession();
  const names = state.universe.length ? state.universe : ["NVDA", "AAPL", "MSFT", "SPY", "QQQ", "IWM"];
  const latestByName = new Map<string, (typeof state.tickets)[0]>();
  for (const ticket of state.tickets) {
    const sym = ticket.proposal.underlying;
    if (!latestByName.has(sym)) latestByName.set(sym, ticket);
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-white/35">SIX NAMES</p>
          <p className="mt-1 max-w-xl text-sm text-white/70">
            Same consider() as Play, across the universe. Follow, fade, or pass. Most names should
            fail the gate. If they all fire, the product is broken.
          </p>
        </div>
        <Button
          onClick={() => void scanUniverse()}
          disabled={jobBusy}
          className="bg-white text-black hover:bg-cyan-200"
        >
          {jobBusy ? "Scanning…" : "Scan universe"}
        </Button>
      </div>
      <p className="mt-2 font-mono text-[11px] text-amber-300/80">
        {armed ? "Armed — passing gates will POST paper mlegs." : "Disarmed — compile and gates only."}
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {names.map((sym) => {
          const ticket = latestByName.get(sym);
          return (
            <div key={sym} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-sm text-white">{sym}</p>
              {ticket ? (
                <>
                  <p className="mt-1 font-mono text-[11px] text-white/50">
                    {printCallFor(ticket).toUpperCase()} · {ticketMark(ticket)}
                  </p>
                  <div className="mt-2">
                    <TicketRow ticket={ticket} />
                  </div>
                </>
              ) : (
                <p className="mt-2 text-[12px] text-white/35">No stamp yet. Scan or run the play.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
