import type { GateName, Regime, Structure, TicketStatus } from "@/lib/enums";

export type GateResult = {
  name: GateName;
  passed: boolean;
  detail: string;
};

export type Leg = {
  symbol: string;
  side: "buy" | "sell";
  ratio_qty: number;
  strike: number | null;
  right: "call" | "put" | null;
};

export type TicketEvent = {
  at: string;
  event: string;
  [key: string]: unknown;
};

export type Ticket = {
  id: string;
  status: TicketStatus;
  created_at?: string;
  updated_at?: string;
  veto_reason: string | null;
  order_payload: Record<string, unknown> | null;
  events?: TicketEvent[];
  proposal: {
    underlying: string;
    structure: Structure;
    thesis: string;
    regime: Regime;
    confidence: number;
    dte: number;
    width: number;
    credit: number | null;
    max_loss: number;
    max_profit: number;
    legs: Leg[];
  };
  gates: GateResult[];
};

export type ChartBar = {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
};

export type ChartState = {
  symbol: string;
  price: number;
  sma20?: number;
  sma50?: number;
  regime: Regime;
  bars: ChartBar[];
};

export type AppState = {
  account: {
    equity: number;
    cash: number;
    buying_power: number;
    last_equity?: number | null;
    paper: boolean;
    live_broker: boolean;
  };
  clock: { is_open: boolean; timestamp: string; mode?: string | null };
  stats: {
    tickets: number;
    vetoed: number;
    open: number;
    closed: number;
    realized_pnl: number;
    veto_rate: number;
  };
  universe: string[];
  kill_switch: boolean;
  limits?: {
    max_loss_per_ticket: number;
    min_credit: number;
  };
  tickets: Ticket[];
};
