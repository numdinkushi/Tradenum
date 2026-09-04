"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnumLabel } from "@/hooks/use-enum-label";
import { TicketStatus } from "@/lib/enums";
import type { Ticket } from "@/lib/types";

function statusVariant(status: Ticket["status"]) {
  if (status === TicketStatus.Vetoed || status === TicketStatus.Failed) return "destructive" as const;
  if (status === TicketStatus.Supervising || status === TicketStatus.Executed) return "default" as const;
  return "outline" as const;
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const label = useEnumLabel();
  const p = ticket.proposal;
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-mono text-base">{ticket.id}</CardTitle>
          <Badge variant={statusVariant(ticket.status)}>{ticket.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {p.underlying} · {label.pretty(p.structure)} · {p.dte} DTE
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>{label.status(ticket.status)}</p>
        <p className="text-muted-foreground">{label.structure(p.structure)}</p>
        <p className="text-sm">{p.thesis}</p>
        <p className="font-mono text-xs text-muted-foreground">
          best ~${p.max_profit.toFixed(0)} · worst ${p.max_loss.toFixed(0)} · premium {p.credit ?? "—"}
        </p>
        {ticket.veto_reason ? (
          <p className="text-sm text-destructive">Blocked · {ticket.veto_reason}</p>
        ) : null}
        <ul className="grid gap-1 text-xs">
          {ticket.gates.map((g) => (
            <li key={g.name} className="flex justify-between gap-3">
              <span className="text-muted-foreground">{label.gate(g.name)}</span>
              <span className={g.passed ? "text-foreground" : "text-destructive"}>
                {g.passed ? "PASS" : "FAIL"}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
