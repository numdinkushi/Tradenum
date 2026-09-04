from __future__ import annotations

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    alpaca_api_key: str = ""
    alpaca_secret_key: str = ""
    alpaca_paper_trade: bool = True

    anthropic_api_key: str = ""
    openai_api_key: str = ""

    tradenum_kill_switch: bool = False
    tradenum_max_loss_per_ticket: float = 750.0
    tradenum_max_open_tickets: int = 4
    tradenum_max_per_underlying: int = 1
    tradenum_min_dte: int = 7
    tradenum_max_dte: int = 45
    tradenum_min_credit: float = 0.25
    tradenum_max_width: float = 10.0
    tradenum_universe: str = "SPY,QQQ,IWM,AAPL,MSFT,NVDA"
    tradenum_ledger_path: Path = Field(default=Path("data/tradenum.db"))

    @property
    def paper_only(self) -> bool:
        return bool(self.alpaca_paper_trade)

    @property
    def has_alpaca(self) -> bool:
        return bool(self.alpaca_api_key and self.alpaca_secret_key)

    @property
    def universe(self) -> list[str]:
        return [s.strip().upper() for s in self.tradenum_universe.split(",") if s.strip()]


def get_settings() -> Settings:
    return Settings()
