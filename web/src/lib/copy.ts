import { GateName, Regime, Structure, TicketStatus } from "@/lib/enums";

export const STRUCTURE_PLAIN: Record<Structure, string> = {
  [Structure.BullPutCredit]:
    "Bet the stock stays up or sideways. We collect a small cash premium. If it falls a lot, a second option caps the loss.",
  [Structure.BearCallCredit]:
    "Bet the stock stays down or sideways. We collect a small cash premium. If it rips higher, a second option caps the loss.",
  [Structure.IronCondor]:
    "Bet the stock stays in a range. We collect premium on both sides. Loss is still capped.",
  [Structure.BullCallDebit]: "Pay a debit to bet the stock goes up, with a capped loss.",
  [Structure.BearPutDebit]: "Pay a debit to bet the stock goes down, with a capped loss.",
};

export const STATUS_PLAIN: Record<TicketStatus, string> = {
  [TicketStatus.Proposed]: "Gates passed. Mleg compiled, not posted (arm is off).",
  [TicketStatus.Vetoed]: "Rejected. The checklist said no. That is still a useful ticket.",
  [TicketStatus.Executed]: "Sent to Alpaca paper trading.",
  [TicketStatus.Supervising]: "Live paper trade. The robot is watching it.",
  [TicketStatus.Closed]: "Trade is done. P&L is locked in (fake money).",
  [TicketStatus.Failed]: "Alpaca rejected the order.",
};

export const GATE_PLAIN: Record<GateName, string> = {
  [GateName.PaperOnly]: "Only fake money (paper trading) is allowed.",
  [GateName.KillSwitch]: "Emergency stop. If on, no new trades.",
  [GateName.DefinedRisk]: "Must buy a hedge. No unlimited-loss bets.",
  [GateName.MaxLoss]: "Worst-case loss must be under the dollar cap.",
  [GateName.DteBand]: "Option must expire in the allowed number of days.",
  [GateName.OpenTicketCap]: "Too many trades already open.",
  [GateName.UnderlyingConcentration]: "Already have a trade on this stock.",
  [GateName.DuplicateStructure]: "Same kind of trade is already open here.",
  [GateName.LegCount]: "Alpaca needs 2–4 option legs in one order.",
  [GateName.Width]: "Strike distance is too wide.",
  [GateName.Confidence]: "The setup is too weak.",
  [GateName.MinCredit]: "Premium collected is too small to be worth it.",
  [GateName.RiskReward]: "Worst-case loss is too big vs the premium we collect.",
  [GateName.BuyingPower]: "Not enough buying power left in the account.",
  [GateName.DebitDefined]: "Debit trade must still have a capped loss.",
};

export const REGIME_PLAIN: Record<Regime, string> = {
  [Regime.Up]: "Price looks like an uptrend.",
  [Regime.Down]: "Price looks like a downtrend.",
  [Regime.Range]: "Price looks stuck in a range.",
};

export const PIPELINE = [
  { step: "1", title: "Look", body: "Read prices for SPY, QQQ, and friends." },
  { step: "2", title: "Suggest", body: "Pick a trade whose worst loss is capped." },
  { step: "3", title: "Check", body: "Python rules decide. Not the AI." },
  { step: "4", title: "Stamp", body: "PASS → paper order. FAIL → keep the veto." },
] as const;
