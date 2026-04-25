"""
IB RegT Margin Calculator — core metrics engine.

Source: IBKR official documentation (ibkrguides.com/reportingreference)

Two-segment architecture:
  Securities (stocks): Available Funds = ELV - IM, Excess Liquidity = ELV - MM
  Commodities (futures): Available Funds = NLV - IM, Excess Liquidity = NLV - MM

For a RegT account without margin loans: ELV ≈ NLV.
This tool uses a unified NLV-based formula and reports both segments separately.

Short stock treatment:
  - Short sale proceeds are already in cash (Total Cash Value from IB includes them)
  - Short MV appears as a liability: NLV = Cash + Long_MV - Short_MV
  - Additional margin required: short_initial_rate × short_MV (on top of proceeds)
  - Net ExLiq impact per $1 short = -(1.0 + maint_rate) e.g. -1.30 for US stocks
"""
import copy
from app.models.account import Portfolio, Metrics
from app.models.position import StockPosition, FuturesPosition
from app.data.market_rules import get_rule
from app.services.fx import to_usd


def _stock_margins(p: StockPosition, fx: dict) -> tuple[float, float, float]:
    """Returns (market_value_usd, initial_margin_usd, maint_margin_usd)."""
    mv = to_usd(abs(p.shares) * p.current_price, p.currency, fx)
    rule = get_rule(p.market)
    if p.shares >= 0:
        im = mv * rule["long_initial"]
        mm = mv * rule["long_maint"]
    else:
        im = mv * rule["short_initial"]
        mm = mv * rule["short_maint"]
    return mv, im, mm


def _futures_margins(p: FuturesPosition, fx: dict) -> tuple[float, float, float, float]:
    """Returns (notional_usd, initial_margin_usd, maint_margin_usd, unrealized_pnl_usd)."""
    n = abs(p.contracts)
    notional = to_usd(n * p.multiplier * p.current_price, p.currency, fx)
    im = to_usd(n * p.initial_margin_per_contract, p.currency, fx)
    mm = to_usd(n * p.maintenance_margin_per_contract, p.currency, fx)
    pnl = to_usd(
        (p.current_price - p.avg_entry_price) * p.contracts * p.multiplier,
        p.currency, fx
    )
    return notional, im, mm, pnl


def calc_metrics(portfolio: Portfolio) -> Metrics:
    fx = portfolio.account.fx_rates
    cash = to_usd(portfolio.account.cash_balance, portfolio.account.base_currency, fx)

    # ── Market values ──────────────────────────────────────────────────────
    long_mv = sum(
        to_usd(p.shares * p.current_price, p.currency, fx)
        for p in portfolio.stocks if p.shares > 0
    )
    short_mv = sum(
        to_usd(abs(p.shares) * p.current_price, p.currency, fx)
        for p in portfolio.stocks if p.shares < 0
    )
    futures_notional = sum(_futures_margins(p, fx)[0] for p in portfolio.futures)

    # ── NLV / ELV ─────────────────────────────────────────────────────────
    # Cash from IB already includes futures daily variation margin settlement
    # Short proceeds are included in cash; short MV is a liability
    nlv = cash + long_mv - short_mv
    elv = nlv  # For RegT accounts without margin loans, ELV ≈ NLV

    # ── Stock margins ──────────────────────────────────────────────────────
    stock_im = 0.0
    stock_mm = 0.0
    per_position: list[dict] = []

    for p in portfolio.stocks:
        mv, im, mm = _stock_margins(p, fx)
        signed_mv = to_usd(p.shares * p.current_price, p.currency, fx)
        unrealized = to_usd((p.current_price - p.avg_cost) * p.shares, p.currency, fx)
        stock_im += im
        stock_mm += mm
        per_position.append({
            "id": p.id,
            "symbol": p.symbol,
            "type": "stock",
            "market": p.market,
            "shares": p.shares,
            "current_price": p.current_price,
            "currency": p.currency,
            "market_value_usd": signed_mv,
            "unrealized_pnl_usd": unrealized,
            "initial_margin_usd": im,
            "maint_margin_usd": mm,
        })

    # ── Futures margins ────────────────────────────────────────────────────
    futures_im = 0.0
    futures_mm = 0.0

    for p in portfolio.futures:
        notional, im, mm, pnl = _futures_margins(p, fx)
        futures_im += im
        futures_mm += mm
        per_position.append({
            "id": p.id,
            "symbol": p.symbol,
            "type": "futures",
            "exchange": p.exchange,
            "contracts": p.contracts,
            "current_price": p.current_price,
            "currency": p.currency,
            "notional_usd": notional,
            "unrealized_pnl_usd": pnl,
            "initial_margin_usd": im,
            "maint_margin_usd": mm,
        })

    total_im = stock_im + futures_im
    total_mm = stock_mm + futures_mm

    # ── Core metrics ───────────────────────────────────────────────────────
    available_funds = elv - total_im
    excess_liquidity = elv - total_mm
    cushion = excess_liquidity / nlv if nlv != 0 else 0.0
    margin_ratio = total_im / nlv if nlv != 0 else 0.0

    # ── Per-segment breakdown (Securities vs Commodities) ──────────────────
    # Securities: ELV-based = (cash + long_mv - short_mv) - stock_mm
    # Commodities: NLV-based = cash_in_futures_segment - futures_mm
    #   Since we use unified cash, commodities ExLiq ≈ -futures_mm (approximation)
    #   The full formula is: combined = securities + commodities
    securities_elv = cash + long_mv - short_mv
    securities_exliq = securities_elv - stock_mm
    commodities_exliq = excess_liquidity - securities_exliq   # reconcile to total

    # ── SMA (securities segment only, snapshot approximation) ─────────────
    # Official: SMA = max(ELV - US_IM, PrevSMA + CashΔ - NewTrade_IM)
    # Approximation: current-day snapshot = max(0, ELV - stock_IM)
    sma = max(0.0, elv - stock_im)

    # ── Buying Power ───────────────────────────────────────────────────────
    # Official: min(ELV, PrevDayELV) - IM × multiplier
    # Non-PDT overnight: × 2 (RegT initial margin = 50% → 2× leverage)
    prev_elv = portfolio.account.prev_day_elv if portfolio.account.prev_day_elv else elv
    effective_elv = min(elv, prev_elv)
    stock_buying_power = max(0.0, (effective_elv - total_im) * 2)
    option_buying_power = max(0.0, available_funds)

    # ── Enrich per_position with % of total margin ─────────────────────────
    for pos in per_position:
        pos["pct_of_total_margin"] = (
            pos["initial_margin_usd"] / total_im * 100 if total_im > 0 else 0.0
        )

    return Metrics(
        nlv=nlv,
        elv=elv,
        long_market_value=long_mv,
        short_market_value=short_mv,
        net_market_value=long_mv - short_mv,
        futures_notional=futures_notional,
        stock_initial_margin=stock_im,
        futures_initial_margin=futures_im,
        total_initial_margin=total_im,
        stock_maint_margin=stock_mm,
        futures_maint_margin=futures_mm,
        total_maint_margin=total_mm,
        available_funds=available_funds,
        excess_liquidity=excess_liquidity,
        cushion=cushion,
        margin_ratio=margin_ratio,
        sma=sma,
        stock_buying_power=stock_buying_power,
        option_buying_power=option_buying_power,
        securities_excess_liquidity=securities_exliq,
        commodities_excess_liquidity=commodities_exliq,
        per_position=per_position,
    )


def apply_shock(portfolio: Portfolio, position_id: str, shock: float) -> Portfolio:
    """Apply a price shock (e.g. -0.20 = -20%) to a single position."""
    p = copy.deepcopy(portfolio)
    for pos in p.stocks:
        if pos.id == position_id:
            pos.current_price *= (1 + shock)
    for pos in p.futures:
        if pos.id == position_id:
            pos.current_price *= (1 + shock)
    return p


def apply_uniform_shock(portfolio: Portfolio, shock: float) -> Portfolio:
    """Apply the same price shock to all positions."""
    p = copy.deepcopy(portfolio)
    for pos in p.stocks:
        pos.current_price *= (1 + shock)
    for pos in p.futures:
        pos.current_price *= (1 + shock)
    return p
