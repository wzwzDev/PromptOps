from __future__ import annotations
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlmodel import SQLModel, Field as SQLField, Session

from ..db import get_session


class Todo(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    title: str
    due: Optional[datetime] = None
    created_at: datetime = SQLField(default_factory=datetime.utcnow)


class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1)
    due: Optional[datetime] = None  # Pydantic v2 will parse ISO8601 strings


class TodoRead(BaseModel):
    id: int
    title: str
    due: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


router = APIRouter(prefix="/api/todos", tags=["todos"])


@router.post("", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def create_todo(body: TodoCreate, session: Session = Depends(get_session)):
    todo = Todo(title=body.title, due=body.due)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo
