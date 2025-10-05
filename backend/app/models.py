from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional as Opt


class PromptLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt: str
    response: str
    model: str
    version: Optional[str] = None
    temperature: float = 0.0
    tokens: int = 0
    latency_ms: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    # Optional user quality rating: 1-5 (or 0/None for unrated)
    rating: Optional[int] = Field(default=None, index=True)


class Board(SQLModel, table=True):
    id: Opt[int] = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class BoardItem(SQLModel, table=True):
    id: Opt[int] = Field(default=None, primary_key=True)
    board_id: int = Field(foreign_key="board.id")
    log_id: int = Field(foreign_key="promptlog.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class Baseline(SQLModel, table=True):
    id: Opt[int] = Field(default=None, primary_key=True)
    prompt: str
    log_id: int = Field(foreign_key="promptlog.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
