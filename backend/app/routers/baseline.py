from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select
from ..db import get_session
from ..models import Baseline, PromptLog


class BaselineSet(BaseModel):
    prompt: str
    log_id: int


class BaselineRead(BaseModel):
    id: int
    prompt: str
    log_id: int

    class Config:
        from_attributes = True


router = APIRouter(prefix="/api/baseline", tags=["baseline"])


@router.post("", response_model=BaselineRead)
def set_baseline(body: BaselineSet, session: Session = Depends(get_session)):
    log = session.get(PromptLog, body.log_id)
    if not log or log.prompt.strip() != body.prompt.strip():
        raise HTTPException(status_code=400, detail="Log does not match prompt or not found")
    # replace existing baseline for prompt
    existing = session.exec(select(Baseline).where(Baseline.prompt == body.prompt)).first()
    if existing:
        existing.log_id = body.log_id
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    base = Baseline(prompt=body.prompt, log_id=body.log_id)
    session.add(base)
    session.commit()
    session.refresh(base)
    return base


@router.get("", response_model=BaselineRead | None)
def get_baseline(prompt: str, session: Session = Depends(get_session)):
    base = session.exec(select(Baseline).where(Baseline.prompt == prompt)).first()
    return base