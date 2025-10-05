from __future__ import annotations
from datetime import date
from fastapi import APIRouter, Depends
from sqlmodel import select, func

from ..db import get_session
from ..models import PromptLog
from ..schemas import MetricsResponse

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("", response_model=MetricsResponse)
def get_metrics(session=Depends(get_session)):
    # Averages
    avg_latency = session.exec(select(func.avg(PromptLog.latency_ms))).one()
    avg_tokens = session.exec(select(func.avg(PromptLog.tokens))).one()

    # Prompts per day
    rows = session.exec(
        select(func.date(PromptLog.timestamp), func.count())
        .group_by(func.date(PromptLog.timestamp))
        .order_by(func.date(PromptLog.timestamp))
    ).all()
    prompts_per_day = [
        {"date": str(d) if not isinstance(d, date) else d.isoformat(), "count": c}
        for d, c in rows
    ]

    return MetricsResponse(
        avg_latency_ms=float(avg_latency or 0),
        avg_tokens=float(avg_tokens or 0),
        prompts_per_day=prompts_per_day,
    )
