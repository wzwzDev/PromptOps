from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import openai
import os
import numpy as np
from sqlmodel import Session
from ..db import get_session
from ..models import SQLModel
from sqlmodel import Field
# Pinecone integration
from pinecone import Pinecone, ServerlessSpec

router = APIRouter(prefix="/api/prompt", tags=["prompt"])

class MutationRequest(BaseModel):
    prompt: str
    mutations: List[str]  # e.g. ["rewrite in fewer tokens", "make more formal"]
    models: Optional[List[str]] = ["gpt-3.5-turbo"]
    embedding_model: Optional[str] = "text-embedding-ada-002"

class FeedbackRequest(BaseModel):
    prompt: str
    mutation: str
    mutated_prompt: str
    rating: str
    annotation: Optional[str] = None
    suggestion: Optional[str] = None

class MutationFeedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt: str
    mutation: str
    mutated_prompt: str
    rating: str
    annotation: Optional[str] = None
    suggestion: Optional[str] = None
    timestamp: Optional[str] = Field(default_factory=lambda: str(np.datetime64('now')))

def get_embedding(text: str, model: str = "text-embedding-ada-002") -> List[float]:
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    response = client.embeddings.create(input=[text], model=model)
    return response.data[0].embedding

# Pinecone setup (v3.x)
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "demo-key")
PINECONE_INDEX = os.getenv("PINECONE_INDEX", "promptops-index")
PINECONE_CLOUD = os.getenv("PINECONE_CLOUD", "aws")
PINECONE_REGION = os.getenv("PINECONE_REGION", "us-east-1")
pc = Pinecone(api_key=PINECONE_API_KEY)
if PINECONE_INDEX not in pc.list_indexes().names():
    pc.create_index(
        name=PINECONE_INDEX,
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(cloud=PINECONE_CLOUD, region=PINECONE_REGION)
    )
index = pc.Index(PINECONE_INDEX)

@router.post("/mutate-analyze")
async def mutate_and_analyze(request: MutationRequest, session: Session = Depends(get_session)):
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    # Fetch feedback for mutations
    feedbacks = session.query(MutationFeedback).filter(MutationFeedback.prompt == request.prompt).all()
    # Aggregate feedback
    rating_map = {}
    suggestion_map = {}
    for fb in feedbacks:
        m = fb[0]
        r = fb[1]
        s = fb[2]
        rating_map.setdefault(m, []).append(r)
        if s:
            suggestion_map.setdefault(m, []).append(s)
    # Prefer mutations with more 'excellent'/'good' ratings, avoid 'poor'
    preferred_mutations = []
    for m in request.mutations:
        ratings = rating_map.get(m, [])
        if ratings.count("poor") > ratings.count("excellent") + ratings.count("good"):
            continue  # skip mutation with more poor than good/excellent
        preferred_mutations.append(m)
    # If none preferred, fallback to all
    if not preferred_mutations:
        preferred_mutations = request.mutations
    results = []
    for mutation in preferred_mutations:
        # Mutate prompt using AI, optionally apply suggestions
        suggestions = suggestion_map.get(mutation, [])
        suggestion_text = "\n".join(suggestions) if suggestions else ""
        mutation_prompt = f"Rewrite the following prompt: '{request.prompt}'\nInstruction: {mutation}"
        if suggestion_text:
            mutation_prompt += f"\nUser suggestions: {suggestion_text}"
        mutation_resp = client.chat.completions.create(
            model=request.models[0],
            messages=[{"role": "user", "content": mutation_prompt}],
            max_tokens=256,
            temperature=0.7,
        )
        mutated_prompt = mutation_resp.choices[0].message.content.strip()
        outputs = []
        for model in request.models:
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": mutated_prompt}],
                max_tokens=512,
                temperature=0.7,
            )
            output = resp.choices[0].message.content.strip()
            tokens_used = resp.usage.total_tokens if hasattr(resp, "usage") else len(output.split())
            embedding = get_embedding(output, request.embedding_model)
            # Store output embedding in Pinecone (v3.x)
            vector_id = f"{mutation}-{model}-{tokens_used}"
            index.upsert(vectors=[{"id": vector_id, "values": embedding}])
            # Retrieve similar prompts from Pinecone (v3.x)
            query_result = index.query(vector=embedding, top_k=3, include_values=False)
            # Ensure Pinecone QueryResponse is JSON serializable
            retrieval_serialized = query_result.to_dict() if hasattr(query_result, 'to_dict') else dict(query_result)
            outputs.append({
                "model": model,
                "output": output,
                "tokens_used": tokens_used,
                "embedding": embedding,
                "retrieval": retrieval_serialized,
            })
        if len(outputs) > 1:
            emb1 = np.array(outputs[0]["embedding"])
            emb2 = np.array(outputs[1]["embedding"])
            similarity = float(np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2)))
        else:
            similarity = None
        for o in outputs:
            o["token_efficiency"] = len(o["output"]) / max(1, o["tokens_used"])
        if len(outputs) > 1:
            diff = [
                {"line": i, "model1": l1, "model2": l2}
                for i, (l1, l2) in enumerate(zip(outputs[0]["output"].splitlines(), outputs[1]["output"].splitlines()))
                if l1 != l2
            ]
        else:
            diff = []
        results.append({
            "mutation": mutation,
            "mutated_prompt": mutated_prompt,
            "outputs": outputs,
            "similarity": similarity,
            "diff": diff,
        })
    # Retrieval-augmented testing now enabled
    return JSONResponse({"results": results})


# --- Feedback endpoint ---
@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest, session: Session = Depends(get_session)):
    feedback = MutationFeedback(
        prompt=request.prompt,
        mutation=request.mutation,
        mutated_prompt=request.mutated_prompt,
        rating=request.rating,
        annotation=request.annotation,
        suggestion=request.suggestion,
    )
    session.add(feedback)
    session.commit()
    session.refresh(feedback)
    return {"status": "success", "id": feedback.id}
