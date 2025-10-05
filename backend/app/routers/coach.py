from __future__ import annotations
import json
import os
from typing import List, Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/prompt", tags=["prompt"])


class CoachRequest(BaseModel):
    prompt: str = Field(..., description="Current user prompt to improve")
    provider: Optional[str] = Field(None, description="openai | ollama | mock")
    model: Optional[str] = Field(None, description="model name for provider")
    count: int = Field(3, ge=1, le=6, description="Number of suggestions to return")
    constraints: Optional[str] = Field(None, description="Additional context or constraints for improvement")


class Suggestion(BaseModel):
    prompt: str
    rationale: str


class CoachResponse(BaseModel):
    suggestions: List[Suggestion]


async def _call_openai_json(model: str, system: str, user: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="OPENAI_API_KEY not set")
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.2,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, headers=headers, json=body)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"OpenAI error: {r.text}")
        data = r.json()
        choice = (data.get("choices") or [{}])[0]
        message = (choice.get("message") or {}).get("content", "")
        return message


async def _call_ollama_json(model: str, prompt: str) -> str:
    base = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    url = f"{base.rstrip('/')}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "options": {"temperature": 0.2},
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, json=payload)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Ollama error: {r.text}")
        data = r.json() or {}
        return data.get("response", "")


def _fallback_suggestions(inp: str, constraints: Optional[str], count: int) -> List[Suggestion]:
    ideas = [
        (f"Add explicit acceptance criteria and a JSON output schema.\n\nTask:\n{inp}\n\nOutput JSON schema: {{'title': str, 'summary': str, 'key_points': [str]}}\n\nRequirements: concise, no extra text.",
         "Explicit format with schema and acceptance criteria reduces ambiguity."),
        (f"Use step-by-step instructions with a rubric.\n\nYou will be evaluated on correctness (50%), completeness (30%), and style (20%).\n\nTask:\n{inp}",
         "Rubrics and stepwise instructions improve reliability."),
        (f"Include 1 positive and 1 negative example and ask for self-check before final.\n\nInput:\n{inp}\n\nPositive example: ...\nNegative example: ...\n\nBefore answering, list 3 likely mistakes and correct them in the final output only.",
         "Few-shot and self-check often boost quality."),
    ]
    if constraints:
        ideas.append((f"Respect these constraints: {constraints}\n\nTask:\n{inp}", "Integrating constraints directly helps alignment."))
    out: List[Suggestion] = []
    for i in range(min(count, len(ideas))):
        p, r = ideas[i]
        out.append(Suggestion(prompt=p, rationale=r))
    while len(out) < count:
        out.append(Suggestion(prompt=f"Clarify format, scope, and success criteria.\n\nTask:\n{inp}", rationale="General clarity improvements."))
    return out


@router.post("/coach", response_model=CoachResponse)
async def coach(req: CoachRequest) -> CoachResponse:
    provider = (req.provider or os.getenv("PROMPT_COACH_PROVIDER") or "openai").lower()
    model = req.model or os.getenv("PROMPT_COACH_MODEL") or ("gpt-4o-mini" if provider == "openai" else "llama3")
    count = req.count
    system = (
        "You are an expert prompt engineer. Improve the user's prompt. "
        "Return strictly JSON with key 'suggestions' as a list of objects with fields 'prompt' and 'rationale'. "
        "Focus on clarity, constraints, format, evaluation criteria, and examples when helpful."
    )
    user = (
        f"INPUT PROMPT:\n{req.prompt}\n\n"
        f"CONSTRAINTS:\n{req.constraints or 'None'}\n\n"
        f"COUNT: {count}"
    )

    try:
        if provider == "openai":
            text = await _call_openai_json(model, system, user)
        elif provider == "ollama":
            instruct = (
                f"{system}\n\n{user}\n\nRespond ONLY with JSON: {{\"suggestions\":[{{\"prompt\":\"...\",\"rationale\":\"...\"}}]}}"
            )
            text = await _call_ollama_json(model, instruct)
        else:
            # mock
            return CoachResponse(suggestions=_fallback_suggestions(req.prompt, req.constraints, count))

        # Try to parse JSON strictly; if it fails, attempt to extract JSON substring
        data = None
        try:
            data = json.loads(text)
        except Exception:
            # heuristic extraction
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                snippet = text[start : end + 1]
                try:
                    data = json.loads(snippet)
                except Exception:
                    data = None
        if not isinstance(data, dict) or not isinstance(data.get("suggestions"), list):
            # fallback
            return CoachResponse(suggestions=_fallback_suggestions(req.prompt, req.constraints, count))

        suggestions: List[Suggestion] = []
        for it in data.get("suggestions", [])[:count]:
            p = str(it.get("prompt") or "").strip()
            r = str(it.get("rationale") or "").strip() or ""
            if p:
                suggestions.append(Suggestion(prompt=p, rationale=r))
        if not suggestions:
            suggestions = _fallback_suggestions(req.prompt, req.constraints, count)
        return CoachResponse(suggestions=suggestions[:count])
    except HTTPException:
        raise
    except Exception as e:
        # final fallback
        return CoachResponse(suggestions=_fallback_suggestions(req.prompt, req.constraints, count))
