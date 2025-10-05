# PromptOps User Guide

A simple guide to help you run, compare, and pick the best prompts and models.

## Overview
PromptOps helps you iterate quickly:
- Run your task with acceptance criteria
- Compare results side-by-side
- Save and rate the best outputs
- Track speed (latency), cost proxy (tokens), and quality (rating)

Use the new Experiment page for a one-page flow with adjustable weights.

## Quick Start
1. Open the app at http://localhost:5173
2. Go to Experiment (default)
3. Set weights (Tokens, Latency, Rating)
4. In Runner, paste your task, constraints, and acceptance criteria
5. Run on the model you want (or multiple)
6. Review Top candidates and save good runs to a Board
7. Go to Logs and set Ratings (1–5); the Score updates and best rows surface
8. Use Compare to view any two runs side-by-side; the “Best” is highlighted

## The Experiment Flow
- Weights: Tune how much tokens, latency, and rating matter for your scenario
- Runner: Execute prompts; try small changes and model swaps
- Top candidates: Auto-sorted by your Score; save to Boards quickly

Score formula (adjustable weights):
```
Score = tokens×wTokens + latency_ms×wLatency − rating×wRating
```
Lower is better.

## Runner
Include in your prompt:
- Context (what you’re building)
- Task (function/component/endpoint)
- Constraints (style, libs, error handling, performance)
- Deliverables (code + rationale + tests)
- Acceptance criteria (your checklist)

Use the Diff tab to compare your latest run with the best recent one for the same prompt. In a follow-up, you can pin a baseline and auto-diff against it.

## Compare
- Pick any two runs from dropdowns and review responses side-by-side
- “Best” is chosen by the same Score logic
- Use this when choosing between models or prompt versions

## Boards
- Save your best runs by feature/topic
- View details in a modal
- Export to JSON/CSV

## Logs
- Browse all runs; see tokens, latency, rating, and Score
- Rate quality 1–5 and the table will re-rank by Score
- Server-side pagination and search (by prompt substring)

## Baseline (optional)
- API: `POST /api/baseline { prompt, log_id }` to pin a baseline for a prompt
- API: `GET /api/baseline?prompt=...` to retrieve it
- Ideal for locking in a best-known output and diffing new runs against it

## Prompt Templates

### FastAPI Endpoint
Goal: Implement POST /api/todos that validates body {title:str, due:str?}, saves via SQLModel, returns 201 + created item.
Stack: FastAPI, SQLModel, SQLite
Constraints: Pydantic v2, proper error handling (422), use dependency-injected Session
Deliverables: endpoint code, SQLModel class, minimal test (pytest) to assert 201 and schema
Acceptance criteria:
- 422 on missing title
- ISO8601 dates parsed correctly
- DB persistence confirmed in test

Add at end: "Validate your solution against acceptance criteria and list any caveats."

### React + Chakra UI Component
Goal: A <UserSearch> component with debounced input, loading state, and results grid.
Stack: React 18, Chakra UI, axios
Constraints: Typescript, accessible (aria), debounce 300ms
Deliverables: component code, minimal test or usage example, reasoning for decisions
Acceptance criteria:
- Shows spinner during fetch
- Empty state message when no results
- Keyboard accessible

Add at end: "Validate your solution against acceptance criteria and list any caveats."

### SQLModel Schema + Migration
Goal: Add rating: Optional[int] to PromptLog with an in-place migration for SQLite.
Constraints: non-destructive; backfill None; index column
Deliverables: model change, init_db migration snippet, quick sanity check

Add at end: "Validate your solution against acceptance criteria and list any caveats."

## Troubleshooting
- Ollama not running: local models won’t list; use OpenAI provider or start Ollama
- OpenAI: ensure OPENAI_API_KEY is set in docker-compose.yml
- DB schema error: restart containers to apply migrations
- TypeScript import errors: run `npm install` in frontend

## FAQ
- Why Score this way? It’s a practical proxy for cost (tokens), speed (latency), and quality (rating). Adjust weights to fit your priorities.
- Can I add my own evals? Yes—add a rating field or custom checks; we can wire an eval harness if you’d like.
- How do I pin a baseline? Call POST /api/baseline then use the Diff tab; we can add a UI button next.
