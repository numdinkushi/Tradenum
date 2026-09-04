from __future__ import annotations

from tradenum.domain.enums import GateName, Regime, Structure, TicketStatus

STRUCTURE_PLAIN: dict[Structure, str] = {
    Structure.BULL_PUT_CREDIT: (
        "Bet the stock stays up or sideways. We collect a small cash premium. "
        "If it falls a lot, a second option caps the loss."
    ),
    Structure.BEAR_CALL_CREDIT: (
        "Bet the stock stays down or sideways. We collect a small cash premium. "
        "If it rips higher, a second option caps the loss."
    ),
    Structure.IRON_CONDOR: (
        "Bet the stock stays in a range. We collect premium on both sides. Loss is still capped."
    ),
    Structure.BULL_CALL_DEBIT: "Pay a debit to bet the stock goes up, with a capped loss.",
    Structure.BEAR_PUT_DEBIT: "Pay a debit to bet the stock goes down, with a capped loss.",
}

STATUS_PLAIN: dict[TicketStatus, str] = {
    TicketStatus.PROPOSED: "Idea passed the safety checklist. Not sent to Alpaca yet (dry run).",
    TicketStatus.VETOED: "Rejected. The safety checklist said no. That is still a useful ticket.",
    TicketStatus.EXECUTED: "Sent to Alpaca paper trading.",
    TicketStatus.SUPERVISING: "Live paper trade. The robot is watching it.",
    TicketStatus.CLOSED: "Trade is done. Profit or loss is locked in (fake money).",
    TicketStatus.FAILED: "Alpaca rejected the order. See the error on the ticket.",
}

GATE_PLAIN: dict[GateName, str] = {
    GateName.PAPER_ONLY: "Only fake money (paper trading) is allowed.",
    GateName.KILL_SWITCH: "Emergency stop. If on, no new trades.",
    GateName.DEFINED_RISK: "Must buy a hedge. No unlimited-loss bets.",
    GateName.MAX_LOSS: "Worst-case loss must be under the dollar cap.",
    GateName.DTE_BAND: "Option must expire in the allowed number of days.",
    GateName.OPEN_TICKET_CAP: "Too many trades already open.",
    GateName.UNDERLYING_CONCENTRATION: "Already have a trade on this stock.",
    GateName.DUPLICATE_STRUCTURE: "Same kind of trade is already open here.",
    GateName.LEG_COUNT: "Alpaca needs 2–4 option legs in one order.",
    GateName.WIDTH: "Strike distance is too wide.",
    GateName.CONFIDENCE: "The setup is too weak.",
    GateName.MIN_CREDIT: "Premium collected is too small to be worth it.",
    GateName.RISK_REWARD: "Worst-case loss is too big vs the premium we collect.",
    GateName.BUYING_POWER: "Not enough buying power left in the account.",
    GateName.DEBIT_DEFINED: "Debit trade must still have a capped loss.",
}

REGIME_PLAIN: dict[Regime, str] = {
    Regime.UP: "Price looks like an uptrend.",
    Regime.DOWN: "Price looks like a downtrend.",
    Regime.RANGE: "Price looks stuck in a range.",
}

REGIME_TO_STRUCTURE: dict[Regime, Structure] = {
    Regime.UP: Structure.BULL_PUT_CREDIT,
    Regime.DOWN: Structure.BEAR_CALL_CREDIT,
    Regime.RANGE: Structure.IRON_CONDOR,
}
