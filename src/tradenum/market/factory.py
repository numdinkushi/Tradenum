from tradenum.config import Settings
from tradenum.market.alpaca import AlpacaMarket
from tradenum.market.demo import DemoMarket
from tradenum.market.resilient import ResilientMarket
from tradenum.ports.market import MarketGateway


def create_market(settings: Settings) -> MarketGateway:
    if settings.has_alpaca:
        return ResilientMarket(AlpacaMarket(settings), DemoMarket())
    return DemoMarket()
