from fastapi import APIRouter
from pydantic import BaseModel
from app.models.account import Portfolio
from app.services import stress_test

router = APIRouter(prefix="/stress", tags=["stress"])


class SingleStressRequest(BaseModel):
    portfolio: Portfolio
    position_id: str
    shock_min: int = -50
    shock_max: int = 50
    step: int = 1


class PortfolioStressRequest(BaseModel):
    portfolio: Portfolio
    shock_min: int = -50
    shock_max: int = 50
    step: int = 1


class HeatmapRequest(BaseModel):
    portfolio: Portfolio
    pos_id_1: str
    pos_id_2: str
    shock_range: list[int] | None = None


@router.post("/single")
def single_stress(req: SingleStressRequest):
    return stress_test.single_position_stress(
        req.portfolio, req.position_id, req.shock_min, req.shock_max, req.step
    )


@router.post("/portfolio")
def portfolio_stress(req: PortfolioStressRequest):
    return stress_test.portfolio_stress(
        req.portfolio, req.shock_min, req.shock_max, req.step
    )


@router.post("/breaking-point")
def breaking_point(portfolio: Portfolio):
    overall = stress_test.find_breaking_point(portfolio)
    per_pos = stress_test.find_per_position_breaking_point(portfolio)
    return {"overall": overall, "per_position": per_pos}


@router.post("/heatmap")
def heatmap(req: HeatmapRequest):
    return stress_test.two_asset_heatmap(
        req.portfolio, req.pos_id_1, req.pos_id_2, req.shock_range
    )
