from __future__ import annotations

from datetime import date, timedelta

from tradenum.domain.constants import DEMO_SPOT, SPREAD_WIDTH
from tradenum.domain.enums import Right
from tradenum.domain.models import OptionContract


def format_ticket_id(seq: int, prefix: str = "TN", pad: int = 4) -> str:
    return f"{prefix}-{seq:0{pad}d}"


def parse_ticket_seq(ticket_id: str) -> int:
    return int(ticket_id.split("-")[1])


def next_friday(min_dte: int, max_dte: int, today: date | None = None) -> date:
    start = today or date.today()
    for offset in range(min_dte, max_dte + 1):
        d = start + timedelta(days=offset)
        if d.weekday() == 4:
            return d
    return start + timedelta(days=min_dte)


def occ_symbol(root: str, expiration: date, right: Right, strike: float) -> str:
    return f"{root}{expiration.strftime('%y%m%d')}{right.occ_code}{int(round(strike * 1000)):08d}"


def parse_occ(symbol: str) -> tuple[str, Right, float]:
    right = Right.CALL if symbol[-9].upper() == "C" else Right.PUT
    strike = int(symbol[-8:]) / 1000.0
    return symbol[:-15], right, strike


def strike_step(spot: float) -> int:
    return 1 if spot < 150 else 5


def nearest(chain: list[OptionContract], strike: float) -> OptionContract | None:
    if not chain:
        return None
    return min(chain, key=lambda c: abs(c.strike - strike))


def pick_otm(chain: list[OptionContract], spot: float, right: Right, otm_pct: float) -> OptionContract | None:
    if right is Right.PUT:
        target = spot * (1 - otm_pct)
        candidates = [c for c in chain if c.strike <= target]
        return max(candidates, key=lambda c: c.strike) if candidates else nearest(chain, target)
    target = spot * (1 + otm_pct)
    candidates = [c for c in chain if c.strike >= target]
    return min(candidates, key=lambda c: c.strike) if candidates else nearest(chain, target)


def hedge_strike(short: OptionContract, right: Right, width: float = SPREAD_WIDTH) -> float:
    return short.strike - width if right is Right.PUT else short.strike + width


def demo_spot(symbol: str) -> float:
    return DEMO_SPOT.get(symbol, 100.0)
