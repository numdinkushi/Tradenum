from __future__ import annotations

from datetime import datetime, timedelta, timezone
from random import Random


def synthetic_ohlc(symbol: str, spot: float, n: int = 80) -> list[dict]:
    rng = Random(sum(ord(c) for c in symbol))
    px = spot * 0.92
    now = datetime.now(timezone.utc).replace(hour=20, minute=0, second=0, microsecond=0)
    bars: list[dict] = []
    for i in range(n):
        drift = (spot - px) / max(n - i, 1)
        change = drift + rng.uniform(-0.012, 0.012) * px
        open_px = px
        close_px = max(px + change, 1.0)
        high = max(open_px, close_px) * (1 + rng.uniform(0.001, 0.008))
        low = min(open_px, close_px) * (1 - rng.uniform(0.001, 0.008))
        ts = now - timedelta(days=n - 1 - i)
        bars.append(
            {
                "t": ts.date().isoformat(),
                "o": round(open_px, 2),
                "h": round(high, 2),
                "l": round(low, 2),
                "c": round(close_px, 2),
            }
        )
        px = close_px
    bars[-1]["c"] = round(spot, 2)
    bars[-1]["h"] = max(bars[-1]["h"], bars[-1]["c"])
    bars[-1]["l"] = min(bars[-1]["l"], bars[-1]["c"])
    return bars
