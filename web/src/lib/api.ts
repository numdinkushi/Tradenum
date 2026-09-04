import type { AppState, ChartState, Ticket } from "@/lib/types";

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = (await res.json()) as { detail?: string; error?: string };
      if (body.detail || body.error) {
        detail = body.detail ?? body.error ?? detail;
      }
    } catch {
      /* keep status text */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  state: () => fetch("/api/state").then((r) => readJson<AppState>(r)),
  consider: (symbol: string, execute: boolean) =>
    fetch("/api/tickets/consider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol, execute }),
    }).then((r) => readJson<{ ticket: Ticket | null }>(r)),
  send: (ticketId: string, override: boolean) =>
    fetch("/api/tickets/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id: ticketId, override }),
    }).then((r) => readJson<{ ticket: Ticket; state: AppState }>(r)),
  scan: (execute: boolean) =>
    fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ execute }),
    }).then((r) => readJson<{ ids: string[]; state: AppState }>(r)),
  supervise: () =>
    fetch("/api/supervise", { method: "POST" }).then((r) =>
      readJson<{ ids: string[]; state: AppState }>(r)
    ),
  chart: (symbol: string) =>
    fetch(`/api/chart/${symbol}`).then((r) => readJson<ChartState>(r)),
};
