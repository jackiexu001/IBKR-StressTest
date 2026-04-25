from typing import Literal, Optional
from pydantic import BaseModel

from app.models.position import StockPosition, FuturesPosition, Currency

AccountType = Literal["RegT", "Cash"]


class Account(BaseModel):
    cash_balance: float
    base_currency: Currency = "USD"
    # fx_rates: foreign currency → USD, e.g. {"HKD": 0.1282, "JPY": 0.0067}
    fx_rates: dict[str, float] = {}
    account_type: AccountType = "RegT"
    prev_day_elv: Optional[float] = None   # for accurate Buying Power calc


class Portfolio(BaseModel):
    account: Account
    stocks: list[StockPosition] = []
    futures: list[FuturesPosition] = []


class Metrics(BaseModel):
    # Net value
    nlv: float
    elv: float
    # Market value breakdown
    long_market_value: float
    short_market_value: float
    net_market_value: float
    futures_notional: float
    # Margin requirements
    stock_initial_margin: float
    futures_initial_margin: float
    total_initial_margin: float
    stock_maint_margin: float
    futures_maint_margin: float
    total_maint_margin: float
    # Core safety metrics
    available_funds: float
    excess_liquidity: float
    cushion: float
    margin_ratio: float
    # SMA & Buying Power (securities segment only)
    sma: float
    stock_buying_power: float
    option_buying_power: float
    # Per-segment breakdown (for dashboard 3-row table)
    securities_excess_liquidity: float
    commodities_excess_liquidity: float
    # Per-position detail
    per_position: list[dict]
