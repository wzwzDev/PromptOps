from __future__ import annotations
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from ..db import get_session
from ..models import Board, BoardItem, PromptLog
from ..schemas import BoardItemView

router = APIRouter(prefix="/api/boards", tags=["boards"])


class BoardCreate(BaseModel):
    name: str


class BoardRead(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=BoardRead)
def create_board(body: BoardCreate, session: Session = Depends(get_session)):
    board = Board(name=body.name)
    session.add(board)
    session.commit()
    session.refresh(board)
    return board


@router.get("", response_model=list[BoardRead])
def list_boards(session: Session = Depends(get_session)):
    return session.exec(select(Board).order_by(Board.created_at.desc())).all()


@router.post("/{board_id}/items/{log_id}")
def add_log_to_board(board_id: int, log_id: int, session: Session = Depends(get_session)):
    board = session.get(Board, board_id)
    log = session.get(PromptLog, log_id)
    if not board or not log:
        raise HTTPException(status_code=404, detail="Board or Log not found")
    item = BoardItem(board_id=board_id, log_id=log_id)
    session.add(item)
    session.commit()
    return {"ok": True}


@router.get("/{board_id}/items", response_model=list[BoardItemView])
def list_board_items(board_id: int, session: Session = Depends(get_session)):
    board = session.get(Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    rows = session.exec(
        select(BoardItem, PromptLog)
        .join(PromptLog, BoardItem.log_id == PromptLog.id)
        .where(BoardItem.board_id == board_id)
        .order_by(BoardItem.created_at.desc())
    ).all()
    items: list[BoardItemView] = []
    for item, log in rows:
        # Pydantic will map ORM instance for nested LogRead
        items.append(BoardItemView(id=item.id, created_at=item.created_at, log=log))
    return items


@router.delete("/{board_id}/items/{item_id}")
def remove_board_item(board_id: int, item_id: int, session: Session = Depends(get_session)):
    item = session.get(BoardItem, item_id)
    if not item or item.board_id != board_id:
        raise HTTPException(status_code=404, detail="Board item not found")
    session.delete(item)
    session.commit()
    return {"ok": True}
