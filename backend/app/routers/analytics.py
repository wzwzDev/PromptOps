from __future__ import annotations
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import select, func, Session
from ..db import get_session
from ..models import PromptAnalytics, Prompt, User
from ..schemas import PromptAnalyticsRead

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/", response_model=List[PromptAnalyticsRead])
def get_analytics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    session: Session = Depends(get_session)
):
    """Get analytics data with pagination"""
    analytics = session.exec(
        select(PromptAnalytics)
        .offset(skip)
        .limit(limit)
        .order_by(PromptAnalytics.date.desc())
    ).all()
    
    return [PromptAnalyticsRead.model_validate(analytic) for analytic in analytics]

@router.get("/summary")
def get_analytics_summary(session: Session = Depends(get_session)):
    """Get aggregated analytics summary"""
    total_executions = session.exec(select(func.count(PromptAnalytics.id))).one()
    avg_latency = session.exec(select(func.avg(PromptAnalytics.avg_latency))).one()
    avg_tokens = session.exec(select(func.avg(PromptAnalytics.total_tokens))).one()
    avg_usage = session.exec(select(func.avg(PromptAnalytics.usage_count))).one()
    
    # Get daily usage for last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    daily_usage = session.exec(
        select(
            func.date(PromptAnalytics.date).label('date'),
            func.sum(PromptAnalytics.usage_count).label('count')
        )
        .where(PromptAnalytics.date >= thirty_days_ago)
        .group_by(func.date(PromptAnalytics.date))
        .order_by(func.date(PromptAnalytics.date))
    ).all()
    
    return {
        "total_executions": total_executions or 0,
        "avg_latency_ms": float(avg_latency or 0),
        "avg_tokens": float(avg_tokens or 0),
        "avg_usage_per_day": float(avg_usage or 0),
        "daily_usage": [
            {"date": str(row.date), "count": row.count}
            for row in daily_usage
        ]
    }

@router.get("/prompt/{prompt_id}")
def get_prompt_analytics(
    prompt_id: int,
    session: Session = Depends(get_session)
):
    """Get analytics for a specific prompt"""
    analytics = session.exec(
        select(PromptAnalytics)
        .where(PromptAnalytics.prompt_id == prompt_id)
        .order_by(PromptAnalytics.date.desc())
    ).all()
    
    if not analytics:
        return {"message": "No analytics data found for this prompt", "data": []}
    
    # Calculate summary stats for this prompt
    total_usage = sum(a.usage_count for a in analytics)
    total_success = sum(a.success_count for a in analytics)
    avg_latency = sum(a.avg_latency for a in analytics) / len(analytics)
    avg_rating = sum(a.avg_rating for a in analytics) / len(analytics)
    success_rate = (total_success / max(total_usage, 1)) * 100
    
    return {
        "prompt_id": prompt_id,
        "total_usage": total_usage,
        "total_success": total_success,
        "avg_latency_ms": avg_latency,
        "avg_rating": avg_rating,
        "success_rate_percent": success_rate,
        "recent_analytics": [
            PromptAnalyticsRead.model_validate(a) for a in analytics[:10]
        ]
    }