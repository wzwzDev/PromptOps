from __future__ import annotations
from datetime import datetime, timedelta
from random import randint, random, choice

from .db import get_session, init_db
from .models import PromptLog


def seed(n: int = 50):
    init_db()
    gen = get_session()
    session = next(gen)
    try:
        now = datetime.utcnow()
        prompts = [
            "Summarize this product review in one sentence.",
            "Write a friendly reply to a customer asking for a refund.",
            "Extract key entities (names, dates, amounts) from the text.",
            "Rewrite this email to be more concise and professional.",
            "Generate 3 title ideas for a blog post about prompt engineering.",
            "Translate this paragraph to French.",
            "Classify the sentiment of this tweet: positive, neutral, negative.",
            "Given these logs, propose 2 actions to reduce latency.",
            "Draft a bug report from the following error logs.",
            "Outline steps to migrate a Flask app to FastAPI.",
        ]
        endings = [
            "Done.",
            "Here are the results.",
            "Let me know if you want more detail.",
            "I recommend A/B testing v2 vs v3.",
            "Additional context may improve accuracy.",
        ]
        for i in range(n):
            ts = now - timedelta(days=randint(0, 14), minutes=randint(0, 1200))
            model = ["gpt-5", "gpt-4o-mini", "gpt-3.5-turbo", "llama3-70b"][randint(0, 3)]
            version = ["v1", "v2", "v3"][randint(0, 2)]
            prompt = choice(prompts)
            response = f"{prompt[:40]} ... {choice(endings)}"
            log = PromptLog(
                prompt=prompt,
                response=response,
                model=model,
                version=version,
                temperature=round(random(), 2),
                tokens=randint(5, 800),
                latency_ms=randint(50, 3000),
                timestamp=ts,
            )
            session.add(log)
        session.commit()
    finally:
        try:
            next(gen)
        except StopIteration:
            pass


if __name__ == "__main__":
    seed()
