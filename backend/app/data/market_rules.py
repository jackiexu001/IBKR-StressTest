from typing import TypedDict


class MarketRule(TypedDict):
    long_initial: float
    long_maint: float
    short_initial: float   # additional margin beyond short proceeds already in cash
    short_maint: float     # additional margin beyond short proceeds already in cash


# Source: IBKR official RegT margin requirements
# short_initial/maint are the EXTRA requirement on top of short proceeds in cash
MARKET_RULES: dict[str, MarketRule] = {
    "US": {"long_initial": 0.50, "long_maint": 0.25, "short_initial": 0.50, "short_maint": 0.30},
    "HK": {"long_initial": 0.50, "long_maint": 0.25, "short_initial": 0.50, "short_maint": 0.30},
    "JP": {"long_initial": 0.30, "long_maint": 0.20, "short_initial": 0.50, "short_maint": 0.30},
    "KR": {"long_initial": 0.40, "long_maint": 0.20, "short_initial": 0.50, "short_maint": 0.30},
    "SG": {"long_initial": 0.50, "long_maint": 0.25, "short_initial": 0.50, "short_maint": 0.30},
}


def get_rule(market: str) -> MarketRule:
    return MARKET_RULES.get(market, MARKET_RULES["US"])
