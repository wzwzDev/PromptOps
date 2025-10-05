from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ..db import get_session, engine
from ..models import PromptLog, Board, BoardItem

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/purge")
def purge_all(confirm: bool = False, session: Session = Depends(get_session)):
    if not confirm:
        raise HTTPException(status_code=400, detail="Pass confirm=true to purge all data.")
    # Delete in order of FK dependencies
    session.exec(select(BoardItem))
    session.query(BoardItem).delete()
    session.query(Board).delete()
    session.query(PromptLog).delete()
    session.commit()
    return {"status": "purged"}
