# PromptOps Python SDK

Simple helper to log prompts to the PromptOps API.

## Install (editable)
```powershell
cd sdk
pip install -e .
```

## Usage
```python
from promptops import log_prompt
log_prompt(
  prompt="Translate to French",
  response="Bonjour",
  model="gpt-5",
  tokens=30,
  latency_ms=120,
  temperature=0.2,
  version="v2",
)
```

Environment variable `PROMPTOPS_API_BASE` can override the API base URL.
