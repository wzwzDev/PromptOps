from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
import os

from .db import init_db
from .routers import logs, metrics
from .routers import admin, boards
from .routers import run as run_router
from .routers import todos
from .routers import baseline
from .routers import coach
from .routers import profile
from .routers import tailor

app = FastAPI(default_response_class=ORJSONResponse, title="PromptOps API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:5175").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(logs.router)
app.include_router(metrics.router)
app.include_router(run_router.router)
app.include_router(admin.router)
app.include_router(boards.router)
app.include_router(todos.router)
app.include_router(baseline.router)
app.include_router(coach.router)
app.include_router(profile.router)
app.include_router(tailor.router)


@app.get("/health")
def health():
    return {"status": "ok"}
