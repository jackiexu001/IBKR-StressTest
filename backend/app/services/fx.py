def to_usd(value: float, currency: str, fx_rates: dict[str, float]) -> float:
    """Convert a value in `currency` to USD using fx_rates {currency: usd_rate}."""
    if currency == "USD":
        return value
    rate = fx_rates.get(currency)
    if not rate:
        raise ValueError(f"Missing FX rate for {currency}. Please add it in account settings.")
    return value * rate
