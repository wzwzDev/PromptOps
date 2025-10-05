from __future__ import annotations
from typing import Generator
from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "promptops.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

# For SQLite in multi-threaded FastAPI, disable same-thread check
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    from . import models  # noqa: F401 ensures core models imported
    # Routers may also define SQLModel tables (e.g., Todo); import to ensure metadata is aware
    try:
        from .routers import todos  # noqa: F401
    except Exception:
        pass
    SQLModel.metadata.create_all(engine)
    # lightweight migrations: ensure columns exist on PromptLog
    with engine.connect() as conn:
        cols = [r[1] for r in conn.exec_driver_sql("PRAGMA table_info(promptlog)").fetchall()]
        if 'version' not in cols:
            conn.exec_driver_sql("ALTER TABLE promptlog ADD COLUMN version VARCHAR")
        if 'timestamp' not in cols:
            conn.exec_driver_sql("ALTER TABLE promptlog ADD COLUMN timestamp DATETIME")
            # backfill newly-added timestamp to now where null
            conn.exec_driver_sql("UPDATE promptlog SET timestamp = CURRENT_TIMESTAMP WHERE timestamp IS NULL")
        if 'rating' not in cols:
            conn.exec_driver_sql("ALTER TABLE promptlog ADD COLUMN rating INTEGER")


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
