from __future__ import annotations
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

if TYPE_CHECKING:
    pass


class PromptStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class PrivacyLevel(str, Enum):
    PRIVATE = "private"
    PUBLIC = "public"
    SHARED = "shared"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: Optional[str] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PromptTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str
    template: str
    category: str = Field(index=True)
    tags: str = ""  # JSON string of tags
    usage_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Prompt(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    content: str
    description: Optional[str] = None
    category: Optional[str] = Field(default=None, index=True)
    tags: str = ""  # JSON string of tags
    status: PromptStatus = Field(default=PromptStatus.ACTIVE)
    privacy: PrivacyLevel = Field(default=PrivacyLevel.PRIVATE)
    usage_count: int = Field(default=0)
    success_rate: float = Field(default=0.0)
    avg_rating: float = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Foreign keys
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")


class PromptVersion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    version_number: int
    content: str
    changes_description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Foreign keys
    prompt_id: int = Field(foreign_key="prompt.id")


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
    success: Optional[bool] = Field(default=None)
    
    # Foreign keys
    prompt_id: Optional[int] = Field(default=None, foreign_key="prompt.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")


class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    helpful: Optional[bool] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Foreign keys
    prompt_id: Optional[int] = Field(default=None, foreign_key="prompt.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")


class PromptShare(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt_id: int = Field(foreign_key="prompt.id")
    shared_with_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    shared_with_email: Optional[str] = None
    permission_level: str = Field(default="read")  # read, write, admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None


class PromptAnalytics(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt_id: int = Field(foreign_key="prompt.id")
    date: datetime = Field(index=True)
    usage_count: int = Field(default=0)
    success_count: int = Field(default=0)
    avg_rating: float = Field(default=0.0)
    avg_latency: float = Field(default=0.0)
    total_tokens: int = Field(default=0)
