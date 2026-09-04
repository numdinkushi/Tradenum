from __future__ import annotations

from datetime import date

from tradenum.config import Settings
from tradenum.domain.models import Proposal, UnderlyingSnapshot
from tradenum.ports.market import MarketGateway
from tradenum.strategy.structures import StructureBuilder


class Proposer:
    def __init__(self, market: MarketGateway, settings: Settings) -> None:
        self.market = market
        self.settings = settings
        self.builder = StructureBuilder(market)

    def propose(self, snap: UnderlyingSnapshot) -> Proposal | None:
        exp = self.market.next_expiry(self.settings.tradenum_min_dte, self.settings.tradenum_max_dte)
        if not exp:
            return None
        dte = (exp - date.today()).days
        return self.builder.build(snap, dte, exp)
