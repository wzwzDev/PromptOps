from __future__ import annotations
import os
from datetime import datetime
import requests

API_BASE = os.getenv("PROMPTOPS_API_BASE", "http://localhost:8000")


def log_prompt(prompt: str, response: str, model: str, tokens: int, latency_ms: int, temperature: float = 0.0, timestamp: datetime | None = None, version: str | None = None):
    payload = {
        "prompt": prompt,
        "response": response,
        "model": model,
        "version": version,
        "temperature": temperature,
        "tokens": tokens,
        "latency_ms": latency_ms,
    }
    if timestamp:
        payload["timestamp"] = timestamp.isoformat()
    r = requests.post(f"{API_BASE}/api/logs", json=payload, timeout=10)
    r.raise_for_status()
    return r.json()
