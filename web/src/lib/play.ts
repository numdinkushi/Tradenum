import type { Ticket } from "@/lib/types";
import { Structure } from "@/lib/enums";

export const PLAY_NODE_IDS = [
  "scan",
  "print",
  "structure",
  "gate",
  "execute",
  "supervise",
] as const;

export type PlayNodeId = (typeof PLAY_NODE_IDS)[number];

export type NodeRunStatus = "idle" | "active" | "passed" | "blocked" | "skipped";

export type PrintCall = "follow" | "fade" | "pass";

export type PlayNodeModel = {
  id: PlayNodeId;
  kicker: string;
  title: string;
  body: string;
};

export const PLAY_GRAPH: PlayNodeModel[] = [
  {
    id: "scan",
    kicker: "01",
    title: "Scan tape",
    body: "Real names. Alpaca bars only.",
  },
  {
    id: "print",
    kicker: "02",
    title: "Unusual print",
    body: "Follow, fade, or pass.",
  },
  {
    id: "structure",
    kicker: "03",
    title: "Build spread",
    body: "Defined-risk options. Never naked.",
  },
  {
    id: "gate",
    kicker: "04",
    title: "Risk gate",
    body: "Python. Not the model.",
  },
  {
    id: "execute",
    kicker: "05",
    title: "Alpaca mleg",
    body: "One broker. Paper account.",
  },
  {
    id: "supervise",
    kicker: "06",
    title: "Supervise",
    body: "Watch open risk. Flatten if tagged.",
  },
];

export const STRUCTURE_SHORT: Record<string, string> = {
  [Structure.BullPutCredit]: "Bull put credit",
  [Structure.BearCallCredit]: "Bear call credit",
  [Structure.IronCondor]: "Iron condor",
  [Structure.BullCallDebit]: "Call debit spread",
  [Structure.BearPutDebit]: "Put debit spread",
};

export function printCallFor(ticket: Ticket | null): PrintCall {
  if (!ticket) return "pass";
  if (ticket.proposal.structure === Structure.IronCondor) return "fade";
  return "follow";
}

export function ticketMark(ticket: Ticket): "BLOCK" | "SENT" | "HELD" | "FAIL" | "PASS" {
  if (ticket.status === "vetoed") return "BLOCK";
  if (ticket.status === "executed" || ticket.status === "supervising") return "SENT";
  if (ticket.status === "failed") return "FAIL";
  if (ticket.status === "proposed") return "HELD";
  return "PASS";
}

export type VerdictTone = "idle" | "quiet" | "blocked" | "clear";

export type DeskStamp = {
  kicker: string;
  line: string;
};

export type CouncilMark = "PASS" | "FAIL" | "SKIP" | "HELD" | "SENT";

export type CouncilRow = {
  kicker: string;
  name: string;
  mark: CouncilMark;
  detail?: string;
};

export type PlayVerdictModel = {
  tone: VerdictTone;
  kicker: string;
  symbol: string | null;
  title: string;
  subtitle: string;
  council: CouncilRow[];
  figures: { label: string; value: string }[];
  ledger: DeskStamp[];
};

function ticketFigures(ticket: Ticket): PlayVerdictModel["figures"] {
  const p = ticket.proposal;
  return [
    { label: "Credit", value: p.credit == null ? "—" : p.credit.toFixed(2) },
    { label: "Max loss", value: `$${p.max_loss.toFixed(2)}` },
    { label: "Max profit", value: `$${p.max_profit.toFixed(2)}` },
    { label: "DTE", value: String(p.dte) },
  ];
}

function gateCouncil(ticket: Ticket): CouncilRow[] {
  const rows: CouncilRow[] = ticket.gates.map((g, i) => ({
    kicker: String(i + 1).padStart(2, "0"),
    name: g.name,
    mark: g.passed ? "PASS" : "FAIL",
    detail: g.passed ? undefined : g.detail,
  }));
  const n = String(rows.length + 1).padStart(2, "0");
  if (ticket.status === "vetoed") {
    rows.push({ kicker: n, name: "mleg", mark: "SKIP", detail: "Not posted." });
  } else if (ticket.status === "executed" || ticket.status === "supervising") {
    rows.push({ kicker: n, name: "mleg", mark: "SENT", detail: "Posted to Alpaca paper." });
  } else {
    rows.push({ kicker: n, name: "mleg", mark: "HELD", detail: "Compiled. Arm was off." });
  }
  return rows;
}

function ledgerStamps(ticket: Ticket): DeskStamp[] {
  return (ticket.events ?? []).map((ev) => ({
    kicker: "N",
    line: [ev.event, ev.reason, ev.structure, ev.regime]
      .filter((x) => typeof x === "string" && x)
      .join(" · "),
  }));
}

export function playVerdict(ticket: Ticket | null, call: PrintCall | null): PlayVerdictModel {
  if (!ticket && !call) {
    return {
      tone: "idle",
      kicker: "WAIT",
      symbol: null,
      title: "No ticket yet",
      subtitle: "Run tape. The numbered play writes the verdict here.",
      council: [],
      figures: [],
      ledger: [],
    };
  }
  if (!ticket || call === "pass") {
    return {
      tone: "quiet",
      kicker: "PASS",
      symbol: null,
      title: "Tape is quiet",
      subtitle: "Agent passed. Most flow is junk.",
      council: [{ kicker: "02", name: "print", mark: "SKIP", detail: "Nothing to sell or buy." }],
      figures: [],
      ledger: [],
    };
  }
  const p = ticket.proposal;
  const structure = STRUCTURE_SHORT[p.structure] ?? p.structure;
  if (ticket.status === "vetoed") {
    return {
      tone: "blocked",
      kicker: "BLOCK",
      symbol: p.underlying,
      title: "Why blocked",
      subtitle: p.thesis,
      council: gateCouncil(ticket),
      figures: ticketFigures(ticket),
      ledger: ledgerStamps(ticket),
    };
  }
  const verb = call === "fade" ? "Fade" : "Follow";
  return {
    tone: "clear",
    kicker: ticket.status === "proposed" ? "CLEAR" : "SENT",
    symbol: p.underlying,
    title: `${verb} · ${structure}`,
    subtitle: p.thesis,
    council: gateCouncil(ticket),
    figures: ticketFigures(ticket),
    ledger: ledgerStamps(ticket),
  };
}

export function deskCaption(ticket: Ticket | null, call: PrintCall): string {
  if (!ticket || call === "pass") {
    return "Tape is quiet. Agent passed — most flow is junk.";
  }
  if (ticket.status === "vetoed") {
    return `${ticket.proposal.underlying}: gate blocked.`;
  }
  const verb = call === "fade" ? "Fading" : "Following";
  const structure = STRUCTURE_SHORT[ticket.proposal.structure] ?? ticket.proposal.structure;
  return `${verb} ${ticket.proposal.underlying} with a ${structure}.`;
}

export function layoutNodes() {
  return PLAY_GRAPH.map((node, i) => ({
    id: node.id,
    type: "play" as const,
    position: { x: 40 + (i % 3) * 220, y: 36 + Math.floor(i / 3) * 168 },
    data: node,
    draggable: false,
    connectable: false,
    selectable: false,
  }));
}

export function layoutEdges() {
  const pairs: [PlayNodeId, PlayNodeId][] = [
    ["scan", "print"],
    ["print", "structure"],
    ["structure", "gate"],
    ["gate", "execute"],
    ["execute", "supervise"],
  ];
  return pairs.map(([source, target]) => ({
    id: `${source}-${target}`,
    source,
    target,
    type: "smoothstep" as const,
    animated: false,
  }));
}
