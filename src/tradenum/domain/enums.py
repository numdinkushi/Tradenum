from __future__ import annotations

from enum import StrEnum


class Side(StrEnum):
    BUY = "buy"
    SELL = "sell"

    @property
    def open_intent(self) -> PositionIntent:
        return PositionIntent.BUY_TO_OPEN if self is Side.BUY else PositionIntent.SELL_TO_OPEN

    @property
    def close_intent(self) -> PositionIntent:
        return PositionIntent.BUY_TO_CLOSE if self is Side.SELL else PositionIntent.SELL_TO_CLOSE

    @property
    def close_side(self) -> Side:
        return Side.BUY if self is Side.SELL else Side.SELL


class Right(StrEnum):
    CALL = "call"
    PUT = "put"

    @property
    def occ_code(self) -> str:
        return "C" if self is Right.CALL else "P"


class Regime(StrEnum):
    UP = "up"
    DOWN = "down"
    RANGE = "range"

    @classmethod
    def from_mas(cls, price: float, sma20: float, sma50: float) -> Regime:
        if price > sma20 > sma50:
            return cls.UP
        if price < sma20 < sma50:
            return cls.DOWN
        return cls.RANGE


class PositionIntent(StrEnum):
    BUY_TO_OPEN = "buy_to_open"
    BUY_TO_CLOSE = "buy_to_close"
    SELL_TO_OPEN = "sell_to_open"
    SELL_TO_CLOSE = "sell_to_close"


class Structure(StrEnum):
    BULL_PUT_CREDIT = "bull_put_credit"
    BEAR_CALL_CREDIT = "bear_call_credit"
    IRON_CONDOR = "iron_condor"
    BULL_CALL_DEBIT = "bull_call_debit"
    BEAR_PUT_DEBIT = "bear_put_debit"

    @property
    def is_credit(self) -> bool:
        return self in {
            Structure.BULL_PUT_CREDIT,
            Structure.BEAR_CALL_CREDIT,
            Structure.IRON_CONDOR,
        }

    @property
    def is_defined_risk(self) -> bool:
        return True


class TicketStatus(StrEnum):
    PROPOSED = "proposed"
    VETOED = "vetoed"
    EXECUTED = "executed"
    SUPERVISING = "supervising"
    CLOSED = "closed"
    FAILED = "failed"

    @property
    def is_live(self) -> bool:
        return self in {TicketStatus.EXECUTED, TicketStatus.SUPERVISING}


class GateName(StrEnum):
    PAPER_ONLY = "paper_only"
    KILL_SWITCH = "kill_switch"
    DEFINED_RISK = "defined_risk"
    MAX_LOSS = "max_loss"
    DTE_BAND = "dte_band"
    OPEN_TICKET_CAP = "open_ticket_cap"
    UNDERLYING_CONCENTRATION = "underlying_concentration"
    DUPLICATE_STRUCTURE = "duplicate_structure"
    LEG_COUNT = "leg_count"
    WIDTH = "width"
    CONFIDENCE = "confidence"
    MIN_CREDIT = "min_credit"
    RISK_REWARD = "risk_reward"
    BUYING_POWER = "buying_power"
    DEBIT_DEFINED = "debit_defined"


class OrderClass(StrEnum):
    MLEG = "mleg"


class OrderType(StrEnum):
    MARKET = "market"
    LIMIT = "limit"


class TimeInForce(StrEnum):
    DAY = "day"


class CliCommand(StrEnum):
    HEARTBEAT = "heartbeat"
    SCAN = "scan"
    SUPERVISE = "supervise"
    STATS = "stats"
    TICKETS = "tickets"
    SERVE = "serve"
