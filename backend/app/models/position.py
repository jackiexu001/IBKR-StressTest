from typing import Literal
from pydantic import BaseModel, Field

Market = Literal["US", "HK", "JP", "KR", "SG"]
Exchange = Literal["CME", "HKEX", "OSE", "KRX", "SGX", "CBOT", "NYMEX"]
Currency = Literal["USD", "HKD", "JPY", "KRW", "SGD"]


class StockPosition(BaseModel):
    id: str
    symbol: str
    name: str = ""
    market: Market
    shares: float                    # negative = short
    avg_cost: float
    current_price: float
    currency: Currency
    initial_margin_rate: float       # e.g. 0.50 for 50%
    maintenance_margin_rate: float   # e.g. 0.25 for 25%


class FuturesPosition(BaseModel):
    id: str
    symbol: str
    name: str = ""
    exchange: Exchange
    contracts: float                 # negative = short
    multiplier: float
    avg_entry_price: float
    current_price: float
    currency: Currency
    initial_margin_per_contract: float
    maintenance_margin_per_contract: float
