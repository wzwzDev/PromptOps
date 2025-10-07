from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from .models import PromptStatus, PrivacyLevel


# User schemas
class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None


class UserRead(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Prompt Template schemas
class PromptTemplateCreate(BaseModel):
    name: str
    description: str
    template: str
    category: str
    tags: List[str] = []


class PromptTemplateRead(BaseModel):
    id: int
    name: str
    description: str
    template: str
    category: str
    tags: List[str] = []
    usage_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Prompt schemas
class PromptCreate(BaseModel):
    title: str
    content: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    privacy: PrivacyLevel = PrivacyLevel.PRIVATE


class PromptUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[PromptStatus] = None
    privacy: Optional[PrivacyLevel] = None


class PromptRead(BaseModel):
    id: int
    title: str
    content: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    status: PromptStatus
    privacy: PrivacyLevel
    usage_count: int
    success_rate: float
    avg_rating: float
    created_at: datetime
    updated_at: datetime
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


# Prompt Version schemas
class PromptVersionCreate(BaseModel):
    content: str
    changes_description: Optional[str] = None


class PromptVersionRead(BaseModel):
    id: int
    version_number: int
    content: str
    changes_description: Optional[str] = None
    created_at: datetime
    prompt_id: int

    class Config:
        from_attributes = True


# Log schemas
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
    success: Optional[bool] = None
    prompt_id: Optional[int] = None
    user_id: Optional[int] = None

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
    success: Optional[bool] = None
    prompt_id: Optional[int] = None
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


# Feedback schemas
class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    helpful: Optional[bool] = None
    prompt_id: Optional[int] = None


class FeedbackRead(BaseModel):
    id: int
    rating: int
    comment: Optional[str] = None
    helpful: Optional[bool] = None
    created_at: datetime
    prompt_id: Optional[int] = None
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


# Sharing schemas
class PromptShareCreate(BaseModel):
    prompt_id: int
    shared_with_user_id: Optional[int] = None
    shared_with_email: Optional[str] = None
    permission_level: str = "read"
    expires_at: Optional[datetime] = None


class PromptShareRead(BaseModel):
    id: int
    prompt_id: int
    shared_with_user_id: Optional[int] = None
    shared_with_email: Optional[str] = None
    permission_level: str
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Analytics schemas
class PromptAnalyticsRead(BaseModel):
    id: int
    prompt_id: int
    date: datetime
    usage_count: int
    success_count: int
    avg_rating: float
    avg_latency: float
    total_tokens: int

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


class PaginatedPrompts(BaseModel):
    items: list[PromptRead]
    total: int
    page: int
    page_size: int
    pages: int


class PaginatedTemplates(BaseModel):
    items: list[PromptTemplateRead]
    total: int
    page: int
    page_size: int
    pages: int


# Search and suggestion schemas
class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    privacy: Optional[PrivacyLevel] = None


class PromptSuggestion(BaseModel):
    original_prompt: str
    suggested_prompt: str
    reason: str
    confidence: float


class TestPromptRequest(BaseModel):
    prompt: str
    sample_input: Optional[str] = None
    model: str = "gpt-3.5-turbo"
    temperature: float = 0.7


class TestPromptResponse(BaseModel):
    prompt: str
    sample_input: Optional[str] = None
    response: str
    model: str
    tokens: int
    latency_ms: int
