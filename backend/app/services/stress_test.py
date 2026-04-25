"""
Stress test engine: curves, breaking points, heatmap.

Breaking point uses binary search (60 iterations → precision < 0.0001%).
Direction logic:
  - Long positions: risk is price DROP → search downward
  - Short positions: risk is price RISE → search upward
  - Mixed portfolio: search both directions
"""
from app.models.account import Portfolio
from app.services.margin import calc_metrics, apply_shock, apply_uniform_shock


def _is_long(pos) -> bool:
    attr = "shares" if hasattr(pos, "shares") else "contracts"
    return getattr(pos, attr) >= 0


# ── 1. Single-position stress curve ───────────────────────────────────────

def single_position_stress(
    portfolio: Portfolio,
    position_id: str,
    shock_min: int = -50,
    shock_max: int = 50,
    step: int = 1,
) -> list[dict]:
    results = []
    for pct in range(shock_min, shock_max + 1, step):
        shocked = apply_shock(portfolio, position_id, pct / 100)
        m = calc_metrics(shocked)
        results.append({
            "shock_pct": pct,
            "excess_liquidity": m.excess_liquidity,
            "nlv": m.nlv,
            "available_funds": m.available_funds,
        })
    return results


# ── 2. Portfolio uniform stress curve ─────────────────────────────────────

def portfolio_stress(
    portfolio: Portfolio,
    shock_min: int = -50,
    shock_max: int = 50,
    step: int = 1,
) -> list[dict]:
    results = []
    for pct in range(shock_min, shock_max + 1, step):
        shocked = apply_uniform_shock(portfolio, pct / 100)
        m = calc_metrics(shocked)
        results.append({
            "shock_pct": pct,
            "excess_liquidity": m.excess_liquidity,
            "nlv": m.nlv,
            "available_funds": m.available_funds,
            "cushion": m.cushion,
        })
    return results


# ── 3. Breaking point (binary search) ─────────────────────────────────────

def _binary_search_uniform(portfolio: Portfolio, direction: float) -> float | None:
    """Return the minimum % shock in `direction` that triggers ExLiq < 0."""
    # Quick check: can 100% shock in this direction trigger liquidation?
    extreme = apply_uniform_shock(portfolio, direction)
    if calc_metrics(extreme).excess_liquidity >= 0:
        return None  # safe even at extreme shock

    lo, hi = 0.0, 1.0
    for _ in range(60):
        mid = (lo + hi) / 2
        shocked = apply_uniform_shock(portfolio, direction * mid)
        if calc_metrics(shocked).excess_liquidity < 0:
            hi = mid
        else:
            lo = mid
    return round(lo * 100, 4)


def _binary_search_single(
    portfolio: Portfolio, position_id: str, direction: float
) -> float | None:
    extreme = apply_shock(portfolio, position_id, direction)
    if calc_metrics(extreme).excess_liquidity >= 0:
        return None

    lo, hi = 0.0, 1.0
    for _ in range(60):
        mid = (lo + hi) / 2
        shocked = apply_shock(portfolio, position_id, direction * mid)
        if calc_metrics(shocked).excess_liquidity < 0:
            hi = mid
        else:
            lo = mid
    return round(lo * 100, 4)


def find_breaking_point(portfolio: Portfolio) -> dict:
    """Portfolio-wide breaking points in both directions."""
    return {
        "down_pct": _binary_search_uniform(portfolio, -1.0),
        "up_pct": _binary_search_uniform(portfolio, 1.0),
    }


def find_per_position_breaking_point(portfolio: Portfolio) -> list[dict]:
    """Per-position breaking point (only its own position is shocked)."""
    results = []
    all_positions = [
        (p, "long" if p.shares >= 0 else "short") for p in portfolio.stocks
    ] + [
        (p, "long" if p.contracts >= 0 else "short") for p in portfolio.futures
    ]

    for pos, side in all_positions:
        # Long: care about price drop; Short: care about price rise
        direction_down = _binary_search_single(portfolio, pos.id, -1.0)
        direction_up = _binary_search_single(portfolio, pos.id, 1.0)
        results.append({
            "id": pos.id,
            "symbol": pos.symbol,
            "side": side,
            "breaking_pct_down": direction_down,
            "breaking_pct_up": direction_up,
            "primary_risk_pct": direction_down if side == "long" else direction_up,
        })
    return results


# ── 4. Two-asset heatmap ───────────────────────────────────────────────────

def two_asset_heatmap(
    portfolio: Portfolio,
    pos_id_1: str,
    pos_id_2: str,
    shock_range: list[int] | None = None,
) -> dict:
    if shock_range is None:
        shock_range = list(range(-40, 5, 5))   # -40% to 0% step 5%

    matrix: list[list[float]] = []
    for s1 in shock_range:
        row = []
        for s2 in shock_range:
            from copy import deepcopy
            p = deepcopy(portfolio)
            for pos in p.stocks + p.futures:
                if pos.id == pos_id_1:
                    pos.current_price *= (1 + s1 / 100)
                elif pos.id == pos_id_2:
                    pos.current_price *= (1 + s2 / 100)
            row.append(round(calc_metrics(p).excess_liquidity, 2))
        matrix.append(row)

    return {
        "x_shocks": shock_range,
        "y_shocks": shock_range,
        "pos_id_1": pos_id_1,
        "pos_id_2": pos_id_2,
        "matrix": matrix,   # matrix[i][j] = ExLiq when pos1=x_shocks[j], pos2=y_shocks[i]
    }
