from __future__ import annotations
import os
import time
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..db import get_session
from ..models import PromptLog

router = APIRouter(prefix="/api/run", tags=["run"])


class RunRequest(BaseModel):
	provider: str = Field(..., description="mock | ollama | openai")
	model: str
	prompt: str
	version: Optional[str] = None
	temperature: float = 0.7



class RunResponse(BaseModel):
	provider: str
	model: str
	version: Optional[str]
	prompt: str
	response: str
	tokens: int
	latency_ms: int
	log_id: int


async def _call_mock(model: str, prompt: str, temperature: float) -> tuple[str, int]:
	# Simple echo-like mock; token estimate is rough
	text = f"[mock:{model} t={temperature}] {prompt[:200]} -> OK"
	tokens = max(1, len(prompt.split()) + 6)
	return text, tokens


async def _call_ollama(model: str, prompt: str, temperature: float) -> tuple[str, int]:
	base = os.getenv("OLLAMA_HOST", "http://localhost:11434")
	url = f"{base.rstrip('/')}/api/generate"
	payload = {
		"model": model,
		"prompt": prompt,
		"options": {"temperature": temperature},
		"stream": False,
	}
	async with httpx.AsyncClient(timeout=60) as client:
		r = await client.post(url, json=payload)
		if r.status_code != 200:
			raise HTTPException(status_code=502, detail=f"Ollama error: {r.text}")
		data = r.json()
		text = data.get("response", "")
		eval_count = data.get("eval_count")
		tokens = int(eval_count) if isinstance(eval_count, int) else max(1, len(text.split()))
		return text, tokens


async def _call_openai(model: str, prompt: str, temperature: float) -> tuple[str, int]:
	api_key = os.getenv("OPENAI_API_KEY")
	if not api_key:
		raise HTTPException(status_code=400, detail="OPENAI_API_KEY not set")
	url = "https://api.openai.com/v1/chat/completions"
	headers = {"Authorization": f"Bearer {api_key}"}
	body = {
		"model": model,
		"messages": [{"role": "user", "content": prompt}],
		"temperature": temperature,
	}
	async with httpx.AsyncClient(timeout=60) as client:
		r = await client.post(url, headers=headers, json=body)
		if r.status_code != 200:
			raise HTTPException(status_code=502, detail=f"OpenAI error: {r.text}")
		data = r.json()
		choice = (data.get("choices") or [{}])[0]
		message = (choice.get("message") or {}).get("content", "")
		usage = data.get("usage") or {}
		tokens = usage.get("total_tokens") or max(1, len(message.split()))
		return message, int(tokens)


@router.post("", response_model=RunResponse)
async def run(req: RunRequest, session=Depends(get_session)):
	start = time.perf_counter()
	provider = req.provider.lower()
	if provider == "mock":
		text, tokens = await _call_mock(req.model, req.prompt, req.temperature)
	elif provider == "ollama":
		text, tokens = await _call_ollama(req.model, req.prompt, req.temperature)
	elif provider == "openai":
		text, tokens = await _call_openai(req.model, req.prompt, req.temperature)
	else:
		raise HTTPException(status_code=400, detail="Unsupported provider")
	latency_ms = int((time.perf_counter() - start) * 1000)

	# Persist log
	log = PromptLog(
		prompt=req.prompt,
		response=text,
		model=req.model,
		version=req.version,
		temperature=req.temperature,
		tokens=int(tokens),
		latency_ms=latency_ms,
	)
	session.add(log)
	session.commit()
	session.refresh(log)

	return RunResponse(
		provider=provider,
		model=req.model,
		version=req.version,
		prompt=req.prompt,
		response=text,
		tokens=int(tokens),
		latency_ms=latency_ms,
		log_id=log.id,
	)


@router.get("/models")
async def list_models(provider: str):
	provider = provider.lower()
	if provider == "openai":
		api_key = os.getenv("OPENAI_API_KEY")
		if not api_key:
			raise HTTPException(status_code=400, detail="OPENAI_API_KEY not set")
		url = "https://api.openai.com/v1/models"
		headers = {"Authorization": f"Bearer {api_key}"}
		async with httpx.AsyncClient(timeout=30) as client:
			r = await client.get(url, headers=headers)
			if r.status_code != 200:
				raise HTTPException(status_code=502, detail=f"OpenAI error: {r.text}")
			data = r.json() or {}
			items = data.get("data", [])
			# filter to openai-owned chat capable models; fallback to ids with 'gpt'
			ids = [m.get("id") for m in items if m.get("owned_by") == "openai" and isinstance(m.get("id"), str)]
			ids = [i for i in ids if i and (i.startswith("gpt") or i.startswith("o"))]
			ids = sorted(set(ids))
			return {"models": ids}
	elif provider == "ollama":
		base = os.getenv("OLLAMA_HOST", "http://localhost:11434")
		url = f"{base.rstrip('/')}/api/tags"
		async with httpx.AsyncClient(timeout=15) as client:
			r = await client.get(url)
			if r.status_code != 200:
				raise HTTPException(status_code=502, detail=f"Ollama error: {r.text}")
			data = r.json() or {}
			models = [m.get("name") for m in data.get("models", []) if isinstance(m.get("name"), str)]
			return {"models": models}
	else:
		raise HTTPException(status_code=400, detail="Unsupported provider")
