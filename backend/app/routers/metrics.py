from fastapi import APIRouter
from app.models.account import Portfolio, Metrics
from app.services.margin import calc_metrics

router = APIRouter(tags=["metrics"])


@router.post("/metrics", response_model=Metrics)
def get_metrics(portfolio: Portfolio) -> Metrics:
    return calc_metrics(portfolio)
