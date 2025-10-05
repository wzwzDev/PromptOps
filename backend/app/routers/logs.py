from __future__ import annotations
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import select
from sqlalchemy import func

from ..db import get_session
from ..models import PromptLog
from ..schemas import LogCreate, LogRead, PaginatedLogs

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.post("", response_model=LogRead)
def create_log(payload: LogCreate, session=Depends(get_session)):
    timestamp = payload.timestamp or datetime.utcnow()
    log = PromptLog(
        prompt=payload.prompt,
        response=payload.response,
        model=payload.model,
        version=payload.version,
        temperature=payload.temperature,
        tokens=payload.tokens,
        latency_ms=payload.latency_ms,
        timestamp=timestamp,
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log


@router.get("/{log_id}", response_model=LogRead)
def get_log(log_id: int, session=Depends(get_session)):
    log = session.get(PromptLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log


@router.get("", response_model=PaginatedLogs)
def list_logs(
    model: Optional[str] = None,
    version: Optional[str] = None,
    start: Optional[datetime] = Query(None, description="Start datetime ISO"),
    end: Optional[datetime] = Query(None, description="End datetime ISO"),
    min_tokens: Optional[int] = None,
    max_tokens: Optional[int] = None,
    q: Optional[str] = Query(None, description="Search prompt substring"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    session=Depends(get_session),
):
    # Build filtered query without order for counting
    filtered = select(PromptLog)
    if model:
        filtered = filtered.where(PromptLog.model == model)
    if version:
        filtered = filtered.where(PromptLog.version == version)
    if start:
        filtered = filtered.where(PromptLog.timestamp >= start)
    if end:
        filtered = filtered.where(PromptLog.timestamp <= end)
    if min_tokens is not None:
        filtered = filtered.where(PromptLog.tokens >= min_tokens)
    if max_tokens is not None:
        filtered = filtered.where(PromptLog.tokens <= max_tokens)
    if q:
        # SQLite has no ILIKE; use LOWER() LIKE for case-insensitive search
        filtered = filtered.where(func.lower(PromptLog.prompt).like(f"%{q.lower()}%"))

    # Total count (avoid ORDER BY in count)
    total = session.exec(select(func.count()).select_from(filtered.subquery())).one()

    # Pagination with order
    ordered = filtered.order_by(PromptLog.timestamp.desc())
    items = session.exec(ordered.offset((page - 1) * page_size).limit(page_size)).all()
    pages = (total + page_size - 1) // page_size if total else 0
    return {
        "items": items,
        "total": int(total or 0),
        "page": page,
        "page_size": page_size,
        "pages": int(pages),
    }


@router.patch("/{log_id}", response_model=LogRead)
def update_log(log_id: int, rating: Optional[int] = Query(None, ge=1, le=5), session=Depends(get_session)):
    log = session.get(PromptLog, log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    if rating is not None:
        log.rating = rating
    session.add(log)
    session.commit()
    session.refresh(log)
    return log
