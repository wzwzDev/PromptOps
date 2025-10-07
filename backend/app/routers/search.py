"""
Router for semantic search and AI-powered prompt suggestions.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, or_
from ..db import get_session
from ..models import Prompt, PromptTemplate, PromptLog
from ..schemas import SearchRequest, PromptSuggestion, PromptRead, PromptTemplateRead
import openai
import pinecone
import json
import os
from datetime import datetime, timedelta

# Initialize OpenAI client
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


router = APIRouter()


def get_current_user_id() -> int:
    """Mock function - replace with actual auth"""
    return 1


def get_pinecone_index():
    """Get Pinecone index for vector search"""
    try:
        # Initialize Pinecone
        pinecone.init(
            api_key=os.getenv("PINECONE_API_KEY"),
            environment=os.getenv("PINECONE_REGION", "us-east-1-aws")
        )
        
        index_name = "prompts"
        if index_name not in pinecone.list_indexes():
            # Create index if it doesn't exist
            pinecone.create_index(
                name=index_name,
                dimension=1536,  # OpenAI embedding dimension
                metric="cosine"
            )
        
        return pinecone.Index(index_name)
    except Exception as e:
        print(f"Pinecone error: {e}")
        return None


def get_embedding(text: str) -> List[float]:
    """Get OpenAI embedding for text"""
    try:
        response = openai.Embedding.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response['data'][0]['embedding']
    except Exception as e:
        print(f"OpenAI embedding error: {e}")
        return []


@router.post("/search/semantic")
def semantic_search(
    request: SearchRequest,
    limit: int = 10,
    session: Session = Depends(get_session)
):
    """Perform semantic search across prompts and templates"""
    results = {"prompts": [], "templates": []}
    
    # Get Pinecone index
    index = get_pinecone_index()
    
    if index:
        # Get query embedding
        query_embedding = get_embedding(request.query)
        
        if query_embedding:
            # Search in Pinecone
            search_results = index.query(
                vector=query_embedding,
                top_k=limit * 2,  # Get more results to filter
                include_metadata=True,
                filter={
                    "type": {"$in": ["prompt", "template"]},
                    **({"category": request.category} if request.category else {}),
                    **({"privacy": request.privacy.value} if request.privacy else {})
                }
            )
            
            # Separate prompts and templates
            prompt_ids = []
            template_ids = []
            
            for match in search_results.matches:
                if match.metadata.get("type") == "prompt":
                    prompt_ids.append(int(match.metadata["id"]))
                elif match.metadata.get("type") == "template":
                    template_ids.append(int(match.metadata["id"]))
            
            # Fetch actual objects from database
            if prompt_ids:
                prompts = session.exec(
                    select(Prompt).where(Prompt.id.in_(prompt_ids))
                ).all()
                
                for prompt in prompts[:limit//2]:
                    result = PromptRead.model_validate(prompt)
                    result.tags = json.loads(prompt.tags) if prompt.tags else []
                    results["prompts"].append(result)
            
            if template_ids:
                templates = session.exec(
                    select(PromptTemplate).where(PromptTemplate.id.in_(template_ids))
                ).all()
                
                for template in templates[:limit//2]:
                    result = PromptTemplateRead.model_validate(template)
                    result.tags = json.loads(template.tags) if template.tags else []
                    results["templates"].append(result)
    
    # Fallback to text search if semantic search fails
    if not results["prompts"] and not results["templates"]:
        # Text search for prompts
        prompt_query = select(Prompt).where(
            or_(
                Prompt.title.contains(request.query),
                Prompt.content.contains(request.query),
                Prompt.description.contains(request.query)
            )
        )
        
        if request.category:
            prompt_query = prompt_query.where(Prompt.category == request.category)
        if request.privacy:
            prompt_query = prompt_query.where(Prompt.privacy == request.privacy)
        
        prompts = session.exec(prompt_query.limit(limit//2)).all()
        
        for prompt in prompts:
            result = PromptRead.model_validate(prompt)
            result.tags = json.loads(prompt.tags) if prompt.tags else []
            results["prompts"].append(result)
        
        # Text search for templates
        template_query = select(PromptTemplate).where(
            or_(
                PromptTemplate.name.contains(request.query),
                PromptTemplate.description.contains(request.query),
                PromptTemplate.template.contains(request.query)
            )
        )
        
        if request.category:
            template_query = template_query.where(PromptTemplate.category == request.category)
        
        templates = session.exec(template_query.limit(limit//2)).all()
        
        for template in templates:
            result = PromptTemplateRead.model_validate(template)
            result.tags = json.loads(template.tags) if template.tags else []
            results["templates"].append(result)
    
    return results


@router.post("/search/similar/{prompt_id}")
def find_similar_prompts(
    prompt_id: int,
    limit: int = 5,
    session: Session = Depends(get_session)
):
    """Find prompts similar to the given prompt"""
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    index = get_pinecone_index()
    results = []
    
    if index:
        # Get embedding for the prompt
        query_embedding = get_embedding(prompt.content)
        
        if query_embedding:
            # Search for similar prompts
            search_results = index.query(
                vector=query_embedding,
                top_k=limit + 1,  # +1 to exclude the original
                include_metadata=True,
                filter={"type": "prompt"}
            )
            
            # Get similar prompt IDs (excluding the original)
            similar_ids = [
                int(match.metadata["id"]) 
                for match in search_results.matches 
                if int(match.metadata["id"]) != prompt_id
            ][:limit]
            
            # Fetch from database
            if similar_ids:
                similar_prompts = session.exec(
                    select(Prompt).where(Prompt.id.in_(similar_ids))
                ).all()
                
                for p in similar_prompts:
                    result = PromptRead.model_validate(p)
                    result.tags = json.loads(p.tags) if p.tags else []
                    results.append(result)
    
    return results


@router.post("/suggestions/{prompt_id}")
def get_prompt_suggestions(
    prompt_id: int,
    session: Session = Depends(get_session)
) -> List[PromptSuggestion]:
    """Get AI-powered suggestions for improving a prompt"""
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    user_id = get_current_user_id()
    if prompt.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        # Get feedback and performance data
        avg_rating = prompt.avg_rating
        success_rate = prompt.success_rate
        usage_count = prompt.usage_count
        
        # Analyze recent logs for patterns
        recent_logs = session.exec(
            select(PromptLog)
            .where(PromptLog.prompt_id == prompt_id)
            .where(PromptLog.timestamp > datetime.utcnow() - timedelta(days=30))
            .order_by(PromptLog.timestamp.desc())
            .limit(10)
        ).all()
        
        # Prepare context for AI suggestions
        context = f"""
        Prompt: {prompt.content}
        Category: {prompt.category or 'General'}
        Average Rating: {avg_rating}/5
        Success Rate: {success_rate * 100:.1f}%
        Usage Count: {usage_count}
        Recent Performance: {'Good' if avg_rating > 3.5 else 'Needs Improvement'}
        """
        
        # Get AI suggestions
        try:
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert prompt engineer. Analyze the given prompt and provide 3-5 specific suggestions for improvement. 
                        Focus on clarity, effectiveness, and user engagement. 
                        Consider the performance metrics provided.
                        
                        Return suggestions in this format:
                        1. [Suggestion] - [Reason] - [Confidence: 0-1]
                        2. [Suggestion] - [Reason] - [Confidence: 0-1]
                        etc."""
                },
                {
                    "role": "user",
                    "content": context
                }
            ],
            temperature=0.3
        )
        
            suggestions_text = response.choices[0].message.content
        
        except Exception as e:
            # Fallback suggestions if OpenAI fails
            suggestions_text = """1. Add more specific context variables - Helps users provide relevant information - Confidence: 0.9
2. Include example outputs - Shows expected format and style - Confidence: 0.8
3. Add constraints or requirements - Prevents unwanted outputs - Confidence: 0.7"""
        
        suggestions = []
        
        # Parse suggestions
        for line in suggestions_text.split('\n'):
            if line.strip() and (line.startswith(tuple('123456789'))):
                try:
                    parts = line.split(' - ')
                    if len(parts) >= 3:
                        suggestion_text = parts[0].split('.', 1)[1].strip()
                        reason = parts[1].strip()
                        confidence_text = parts[2].strip()
                        confidence = float(confidence_text.split(':')[1].strip()) if ':' in confidence_text else 0.8
                        
                        suggestions.append(PromptSuggestion(
                            original_prompt=prompt.content,
                            suggested_prompt=suggestion_text,
                            reason=reason,
                            confidence=confidence
                        ))
                except:
                    continue
        
        return suggestions[:5]  # Return max 5 suggestions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating suggestions: {str(e)}")


@router.post("/suggestions/auto-improve/{prompt_id}")
def auto_improve_prompt(
    prompt_id: int,
    session: Session = Depends(get_session)
):
    """Automatically generate an improved version of a prompt"""
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    user_id = get_current_user_id()
    if prompt.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        # Analyze performance issues
        issues = []
        if prompt.avg_rating < 3.5:
            issues.append("low user satisfaction")
        if prompt.success_rate < 0.7:
            issues.append("low success rate")
        if prompt.usage_count < 5:
            issues.append("low adoption")
        
        improvement_context = f"""
        Original Prompt: {prompt.content}
        Category: {prompt.category or 'General'}
        Performance Issues: {', '.join(issues) if issues else 'Generally good performance'}
        
        Please rewrite this prompt to be more effective, clear, and engaging.
        Maintain the original intent but improve the structure, clarity, and likely effectiveness.
        """
        
        try:
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert prompt engineer. Your task is to improve prompts to make them more effective.
                        Focus on:
                        - Clarity and specificity
                        - Better structure and formatting
                        - More engaging language
                        - Actionable instructions
                    - Better context setting
                    
                    Return only the improved prompt, no explanation."""
                },
                {
                    "role": "user",
                    "content": improvement_context
                }
            ],
            temperature=0.3
        )
        
            improved_prompt = response.choices[0].message.content.strip()
        
        except Exception as e:
            # Fallback if OpenAI fails
            improved_prompt = f"Enhanced version: {prompt.content}"
        
        return {
            "original_prompt": prompt.content,
            "improved_prompt": improved_prompt,
            "improvements": issues if issues else ["Enhanced clarity and structure"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error improving prompt: {str(e)}")


@router.post("/index/rebuild")
def rebuild_search_index(session: Session = Depends(get_session)):
    """Rebuild the Pinecone search index with all prompts and templates"""
    index = get_pinecone_index()
    if not index:
        raise HTTPException(status_code=500, detail="Pinecone not available")
    
    try:
        # Clear existing index
        index.delete(delete_all=True)
        
        vectors_to_upsert = []
        
        # Index all prompts
        prompts = session.exec(select(Prompt)).all()
        for prompt in prompts:
            embedding = get_embedding(f"{prompt.title} {prompt.content}")
            if embedding:
                vectors_to_upsert.append({
                    "id": f"prompt_{prompt.id}",
                    "values": embedding,
                    "metadata": {
                        "type": "prompt",
                        "id": str(prompt.id),
                        "title": prompt.title,
                        "category": prompt.category or "",
                        "privacy": prompt.privacy.value,
                        "tags": prompt.tags or ""
                    }
                })
        
        # Index all templates
        templates = session.exec(select(PromptTemplate)).all()
        for template in templates:
            embedding = get_embedding(f"{template.name} {template.description} {template.template}")
            if embedding:
                vectors_to_upsert.append({
                    "id": f"template_{template.id}",
                    "values": embedding,
                    "metadata": {
                        "type": "template",
                        "id": str(template.id),
                        "name": template.name,
                        "category": template.category,
                        "tags": template.tags or ""
                    }
                })
        
        # Upsert in batches
        batch_size = 100
        for i in range(0, len(vectors_to_upsert), batch_size):
            batch = vectors_to_upsert[i:i + batch_size]
            index.upsert(vectors=batch)
        
        return {
            "message": "Search index rebuilt successfully",
            "indexed_prompts": len(prompts),
            "indexed_templates": len(templates)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rebuilding index: {str(e)}")


@router.get("/trending")
def get_trending_prompts(
    days: int = 7,
    limit: int = 10,
    session: Session = Depends(get_session)
):
    """Get trending prompts based on recent usage"""
    # Get prompts with high recent activity
    trending = session.exec(
        select(Prompt)
        .where(Prompt.privacy == "public")
        .order_by(Prompt.usage_count.desc(), Prompt.avg_rating.desc())
        .limit(limit)
    ).all()
    
    results = []
    for prompt in trending:
        result = PromptRead.model_validate(prompt)
        result.tags = json.loads(prompt.tags) if prompt.tags else []
        results.append(result)
    
    return results