from pydantic import BaseModel, field_validator

Market = str
Exchange = str
Currency = str

_VALID_MARKETS = {"US", "HK", "JP", "KR", "SG"}
_VALID_CURRENCIES = {"USD", "HKD", "JPY", "KRW", "SGD"}
_VALID_EXCHANGES = {"CME", "HKEX", "OSE", "KRX", "SGX", "CBOT", "NYMEX"}


class StockPosition(BaseModel):
    id: str
    symbol: str
    name: str = ""
    market: str = "US"
    shares: float
    avg_cost: float
    current_price: float
    currency: str = "USD"
    initial_margin_rate: float
    maintenance_margin_rate: float

    @field_validator("market", mode="before")
    @classmethod
    def coerce_market(cls, v: str) -> str:
        return v if v in _VALID_MARKETS else "US"

    @field_validator("currency", mode="before")
    @classmethod
    def coerce_currency(cls, v: str) -> str:
        return v if v in _VALID_CURRENCIES else "USD"


class FuturesPosition(BaseModel):
    id: str
    symbol: str
    name: str = ""
    exchange: str = "CME"
    contracts: float
    multiplier: float
    avg_entry_price: float
    current_price: float
    currency: str = "USD"
    initial_margin_per_contract: float
    maintenance_margin_per_contract: float

    @field_validator("exchange", mode="before")
    @classmethod
    def coerce_exchange(cls, v: str) -> str:
        return v if v in _VALID_EXCHANGES else "CME"

    @field_validator("currency", mode="before")
    @classmethod
    def coerce_currency(cls, v: str) -> str:
        return v if v in _VALID_CURRENCIES else "USD"
