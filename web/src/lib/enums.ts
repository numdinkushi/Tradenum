export const TicketStatus = {
  Proposed: "proposed",
  Vetoed: "vetoed",
  Executed: "executed",
  Supervising: "supervising",
  Closed: "closed",
  Failed: "failed",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const Structure = {
  BullPutCredit: "bull_put_credit",
  BearCallCredit: "bear_call_credit",
  IronCondor: "iron_condor",
  BullCallDebit: "bull_call_debit",
  BearPutDebit: "bear_put_debit",
} as const;

export type Structure = (typeof Structure)[keyof typeof Structure];

export const GateName = {
  PaperOnly: "paper_only",
  KillSwitch: "kill_switch",
  DefinedRisk: "defined_risk",
  MaxLoss: "max_loss",
  DteBand: "dte_band",
  OpenTicketCap: "open_ticket_cap",
  UnderlyingConcentration: "underlying_concentration",
  DuplicateStructure: "duplicate_structure",
  LegCount: "leg_count",
  Width: "width",
  Confidence: "confidence",
  MinCredit: "min_credit",
  RiskReward: "risk_reward",
  BuyingPower: "buying_power",
  DebitDefined: "debit_defined",
} as const;

export type GateName = (typeof GateName)[keyof typeof GateName];

export const Regime = {
  Up: "up",
  Down: "down",
  Range: "range",
} as const;

export type Regime = (typeof Regime)[keyof typeof Regime];
