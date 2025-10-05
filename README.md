# PromptOps Dashboard

## Quick Start

1. Docker up: backend on 8000, frontend on 5173
2. Open http://localhost:5173
3. Use Experiment page (default):
  - Set weights for Tokens/Latency/Rating
  - Run prompts in Runner
  - Review Top candidates, Save to Boards
  - Rate runs in Logs; Score highlights the best
4. Compare page: pick any two runs; "Best" is marked
5. Boards: View details and export JSON/CSV

User Guide: see `docs/USER_GUIDE.md` for workflow, templates, and tips.

A lightweight, local-first dashboard for logging, analyzing, and visualizing LLM prompts and responses.

## Tech Stack
- Backend: FastAPI + SQLModel + SQLite
- Frontend: React + Vite + Chakra UI + Recharts
- SDK: Python helper to log prompts
- Containerization: Docker + docker-compose

## Features (MVP)
- POST /api/logs: log a prompt
- GET /api/logs: retrieve logs with filters (model, date range, tokens)
- GET /api/metrics: aggregated metrics
- Frontend dashboard: table, filters, charts
- Runner: call models via provider-agnostic /api/run (mock | ollama | openai)

## Quickstart (Docker)
1. Create `.env` from `.env.example` if needed.
2. Build and run:

```powershell
# From repo root
docker compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

### Configure providers (optional)
- Mock provider requires no setup.
- Ollama: Install Ollama and pull a local model (e.g., `ollama pull llama3:8b`), then expose it to the backend via `OLLAMA_HOST`.
- OpenAI: Set `OPENAI_API_KEY` for the backend.

You can add env vars in `docker-compose.yml` under the backend service:

```yaml
services:
  backend:
    # ...existing config...
    environment:
      - API_HOST=0.0.0.0
      - API_PORT=8000
      - CORS_ORIGINS=http://localhost:5173
      # optional, uncomment and edit:
      # - OLLAMA_HOST=http://host.docker.internal:11434
      # - OPENAI_API_KEY=sk-your-key
```

Notes for Windows with Docker Desktop:
- If Ollama runs on the host, set `OLLAMA_HOST=http://host.docker.internal:11434` so the container can reach it.
- If Ollama runs in another container on the same compose network, use that service name (e.g., `http://ollama:11434`).

## Local Dev (no Docker)
Backend:
```powershell
cd backend
python -m venv .venv; .venv\Scripts\Activate.ps1
pip install -r requirements.txt
# optional: seed sample data
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

Frontend:
```powershell
cd frontend
npm install
npm run dev
```

## Run models (Runner UI and API)

### Runner UI
- Open http://localhost:5173
- At the top, use the Runner panel to:
  - Pick a provider: `mock`, `ollama`, or `openai`
  - Enter a model (e.g., `gpt-4o-mini`, `gpt-5` for mock, `llama3:8b` for Ollama)
  - Optionally set `version` (v1/v2/v3)
  - Enter your prompt and click Run
- The response shows with latency and token count; the run is logged and appears in the table/charts.

### API: POST /api/run
Request body (JSON):

```json
{
  "provider": "mock | ollama | openai",
  "model": "string",
  "prompt": "string",
  "version": "v1",
  "temperature": 0.7
}
```

PowerShell examples:

```powershell
# mock (no setup required)
Invoke-RestMethod -Uri http://localhost:8000/api/run -Method Post -ContentType 'application/json' -Body (
  @{ provider='mock'; model='gpt-5'; prompt='Hello from mock'; version='v2'; temperature=0.2 } | ConvertTo-Json
)

# ollama (requires OLLAMA_HOST and a pulled model such as llama3:8b)
Invoke-RestMethod -Uri http://localhost:8000/api/run -Method Post -ContentType 'application/json' -Body (
  @{ provider='ollama'; model='llama3:8b'; prompt='Write a haiku about dashboards'; version='v2'; temperature=0.7 } | ConvertTo-Json
)

# openai (requires OPENAI_API_KEY)
Invoke-RestMethod -Uri http://localhost:8000/api/run -Method Post -ContentType 'application/json' -Body (
  @{ provider='openai'; model='gpt-4o-mini'; prompt='Summarize: prompt versioning best practices'; version='v3'; temperature=0.5 } | ConvertTo-Json
)
```

Response shape:

```json
{
  "provider": "mock",
  "model": "gpt-5",
  "version": "v2",
  "prompt": "...",
  "response": "...",
  "tokens": 123,
  "latency_ms": 350
}
```

## SDK usage
```python
from promptops import log_prompt
log_prompt(
    prompt="Summarize this text",
    response="...",
    model="gpt-4o-mini",
  version="v2",  # optional
    tokens=123,
    latency_ms=420,
    temperature=0.7,
)
```

## API Examples
```powershell
# Create log
curl -X POST http://localhost:8000/api/logs -H "Content-Type: application/json" -d '{
  "prompt": "Hello",
  "response": "Hi",
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "tokens": 10,
  "latency_ms": 150
}'

# List logs
curl http://localhost:8000/api/logs

# Metrics
curl http://localhost:8000/api/metrics
```

## License
MIT
