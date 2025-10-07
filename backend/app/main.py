from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
import os

from .db import init_db
from .routers import logs, metrics, analytics
from .routers import profile
from .routers import tailor
from .routers import prompt_mutation
from .routers import prompts
from .routers import search
from .routers import sharing

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
app.include_router(analytics.router)
app.include_router(profile.router)
app.include_router(tailor.router)
app.include_router(prompt_mutation.router)
app.include_router(prompts.router)
app.include_router(search.router)
app.include_router(sharing.router)


@app.get("/health")
def health():
    return {"status": "ok"}
