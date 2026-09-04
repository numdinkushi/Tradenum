from __future__ import annotations

from collections.abc import Callable

from tradenum.domain.constants import (
    BUYING_POWER_BUFFER,
    MAX_MLEG_LEGS,
    MIN_CONFIDENCE,
    MIN_MLEG_LEGS,
    RISK_REWARD_CAP,
)
from tradenum.domain.enums import GateName
from tradenum.domain.models import GateResult
from tradenum.risk.context import GateContext

GateFn = Callable[[GateContext], GateResult | None]


def _ok(name: GateName, passed: bool, detail: str) -> GateResult:
    return GateResult(name=name, passed=passed, detail=detail)


def paper_only(ctx: GateContext) -> GateResult:
    return _ok(GateName.PAPER_ONLY, ctx.settings.paper_only, "Paper trading is required for the competition account.")


def kill_switch(ctx: GateContext) -> GateResult:
    return _ok(
        GateName.KILL_SWITCH,
        not ctx.kill_switch,
        "Kill switch is on — new entries blocked." if ctx.kill_switch else "Kill switch off.",
    )


def defined_risk(ctx: GateContext) -> GateResult:
    p = ctx.proposal
    return _ok(
        GateName.DEFINED_RISK,
        p.structure.is_defined_risk and p.has_hedge,
        "Only defined-risk multi-leg structures are allowed.",
    )


def max_loss(ctx: GateContext) -> GateResult:
    cap = ctx.settings.tradenum_max_loss_per_ticket
    return _ok(GateName.MAX_LOSS, 0 < ctx.proposal.max_loss <= cap, f"Max loss ${ctx.proposal.max_loss:.2f} vs cap ${cap:.2f}.")


def dte_band(ctx: GateContext) -> GateResult:
    lo, hi = ctx.settings.tradenum_min_dte, ctx.settings.tradenum_max_dte
    return _ok(GateName.DTE_BAND, lo <= ctx.proposal.dte <= hi, f"DTE {ctx.proposal.dte} must be {lo}–{hi}.")


def open_ticket_cap(ctx: GateContext) -> GateResult:
    cap = ctx.settings.tradenum_max_open_tickets
    n = len(ctx.live)
    return _ok(GateName.OPEN_TICKET_CAP, n < cap, f"{n} open / cap {cap}.")


def underlying_concentration(ctx: GateContext) -> GateResult:
    cap = ctx.settings.tradenum_max_per_underlying
    n = len(ctx.same_underlying)
    return _ok(
        GateName.UNDERLYING_CONCENTRATION,
        n < cap,
        f"{ctx.proposal.underlying} already has {n} open ticket(s).",
    )


def duplicate_structure(ctx: GateContext) -> GateResult:
    dup = any(
        t.proposal.structure == ctx.proposal.structure and t.proposal.underlying == ctx.proposal.underlying
        for t in ctx.live
    )
    return _ok(GateName.DUPLICATE_STRUCTURE, not dup, "Same structure already live on this underlying.")


def leg_count(ctx: GateContext) -> GateResult:
    n = len(ctx.proposal.legs)
    return _ok(GateName.LEG_COUNT, MIN_MLEG_LEGS <= n <= MAX_MLEG_LEGS, f"{n} legs (need {MIN_MLEG_LEGS}–{MAX_MLEG_LEGS} for Alpaca MLEG).")


def width(ctx: GateContext) -> GateResult:
    cap = ctx.settings.tradenum_max_width
    return _ok(GateName.WIDTH, 0 < ctx.proposal.width <= cap, f"Width {ctx.proposal.width} vs cap {cap}.")


def confidence(ctx: GateContext) -> GateResult:
    c = ctx.proposal.confidence
    return _ok(GateName.CONFIDENCE, c >= MIN_CONFIDENCE, f"Confidence {c:.2f} below {MIN_CONFIDENCE}.")


def min_credit(ctx: GateContext) -> GateResult | None:
    if not ctx.proposal.structure.is_credit:
        return None
    floor = ctx.settings.tradenum_min_credit
    credit = ctx.proposal.credit or 0
    return _ok(GateName.MIN_CREDIT, credit >= floor, f"Credit {ctx.proposal.credit} vs min {floor}.")


def risk_reward(ctx: GateContext) -> GateResult | None:
    if not ctx.proposal.structure.is_credit:
        return None
    p = ctx.proposal
    ratio = p.max_loss / max(p.max_profit, 1e-9)
    ok = p.max_profit > 0 and ratio <= RISK_REWARD_CAP
    return _ok(GateName.RISK_REWARD, ok, f"Max loss/profit = {ratio:.2f} (cap {RISK_REWARD_CAP}).")


def debit_defined(ctx: GateContext) -> GateResult | None:
    if ctx.proposal.structure.is_credit:
        return None
    debit = ctx.proposal.debit or 0
    ok = debit > 0 and ctx.proposal.max_loss <= ctx.settings.tradenum_max_loss_per_ticket
    return _ok(GateName.DEBIT_DEFINED, ok, f"Debit {ctx.proposal.debit} must be positive and capped.")


def buying_power(ctx: GateContext) -> GateResult | None:
    if ctx.buying_power is None:
        return None
    need = ctx.proposal.max_loss * BUYING_POWER_BUFFER
    return _ok(GateName.BUYING_POWER, ctx.buying_power >= need, f"Need ${need:.0f} buying power, have ${ctx.buying_power:.0f}.")


GATES: tuple[GateFn, ...] = (
    paper_only,
    kill_switch,
    defined_risk,
    max_loss,
    dte_band,
    open_ticket_cap,
    underlying_concentration,
    duplicate_structure,
    leg_count,
    width,
    confidence,
    min_credit,
    risk_reward,
    debit_defined,
    buying_power,
)
