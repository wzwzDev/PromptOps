from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LogCreate(BaseModel):
    prompt: str
    response: str
    model: str
    version: Optional[str] = None
    temperature: float = 0.0
    tokens: int = 0
    latency_ms: int = Field(0, alias="latency_ms")
    timestamp: Optional[datetime] = None
    rating: Optional[int] = None

    class Config:
        populate_by_name = True


class LogRead(BaseModel):
    id: int
    prompt: str
    response: str
    model: str
    version: Optional[str] = None
    temperature: float
    tokens: int
    latency_ms: int
    timestamp: datetime
    rating: Optional[int] = None

    class Config:
        from_attributes = True


class MetricsResponse(BaseModel):
    avg_latency_ms: float
    avg_tokens: float
    prompts_per_day: list[dict]


class PaginatedLogs(BaseModel):
    items: list[LogRead]
    total: int
    page: int
    page_size: int
    pages: int


class BoardCreate(BaseModel):
    name: str


class BoardRead(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class BoardItemView(BaseModel):
    id: int
    created_at: datetime
    log: LogRead
