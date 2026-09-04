import { ScrollArea } from "@/components/ui/scroll-area";
import { TicketCard } from "@/components/console/ticket-card";
import type { Ticket } from "@/lib/types";

export function Ledger({ tickets }: { tickets: Ticket[] }) {
  if (!tickets.length) {
    return <p className="text-muted-foreground">Click “Show me one ticket” to stamp TN-0001.</p>;
  }
  return (
    <ScrollArea className="h-[72vh] pr-3">
      <div className="grid gap-3">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </ScrollArea>
  );
}
