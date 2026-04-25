def get_rate(currency: str, fx_rates: dict[str, float]) -> float:
    """Return the USD exchange rate for a currency (1.0 for USD)."""
    if currency == "USD":
        return 1.0
    return fx_rates.get(currency) or _FALLBACK_RATES.get(currency) or 0.0


_FALLBACK_RATES: dict[str, float] = {
    "HKD": 0.1282,
    "JPY": 0.0067,
    "KRW": 0.00073,
    "SGD": 0.74,
}

def to_usd(value: float, currency: str, fx_rates: dict[str, float]) -> float:
    """Convert a value in `currency` to USD using fx_rates {currency: usd_rate}.
    Falls back to approximate rates if not configured; USD is always 1:1."""
    if currency == "USD":
        return value
    rate = fx_rates.get(currency) or _FALLBACK_RATES.get(currency)
    if not rate:
        return 0.0
    return value * rate
