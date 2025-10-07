"""
Router for prompt management including versioning, templates, and advanced features.
"""
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, and_, or_, func
from ..db import get_session
from ..models import (
    Prompt, PromptVersion, PromptTemplate, PromptShare, 
    PromptAnalytics, User, Feedback, PromptLog
)
from ..schemas import (
    PromptCreate, PromptRead, PromptUpdate, PromptVersionCreate, 
    PromptVersionRead, PromptTemplateCreate, PromptTemplateRead,
    PaginatedPrompts, PaginatedTemplates, SearchRequest,
    PromptSuggestion, TestPromptRequest, TestPromptResponse,
    PromptShareCreate, PromptShareRead
)
import json
import openai
import os
import time
from typing import Dict, Any

# Initialize OpenAI client
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


router = APIRouter()


# Helper functions
def convert_prompt_to_read(prompt) -> PromptRead:
    """Convert a Prompt model to PromptRead, handling tags JSON parsing"""
    tags = json.loads(prompt.tags) if prompt.tags else []
    
    return PromptRead(
        id=prompt.id,
        title=prompt.title,
        content=prompt.content,
        description=prompt.description,
        category=prompt.category,
        tags=tags,
        status=prompt.status,
        privacy=prompt.privacy,
        usage_count=prompt.usage_count,
        success_rate=prompt.success_rate,
        avg_rating=prompt.avg_rating,
        created_at=prompt.created_at,
        updated_at=prompt.updated_at,
        user_id=prompt.user_id
    )


def convert_template_to_read(template) -> PromptTemplateRead:
    """Convert a PromptTemplate model to PromptTemplateRead, handling tags JSON parsing"""
    tags = json.loads(template.tags) if template.tags else []
    
    return PromptTemplateRead(
        id=template.id,
        name=template.name,
        description=template.description,
        template=template.template,
        category=template.category,
        tags=tags,
        usage_count=template.usage_count,
        created_at=template.created_at,
        updated_at=template.updated_at
    )


def get_current_user_id() -> int:
    """Mock function - replace with actual auth"""
    return 1


def update_prompt_analytics(session: Session, prompt_id: int, success: bool = None, rating: int = None):
    """Update analytics for a prompt"""
    today = datetime.utcnow().date()
    
    # Get or create analytics record for today
    analytics = session.exec(
        select(PromptAnalytics).where(
            and_(
                PromptAnalytics.prompt_id == prompt_id,
                func.date(PromptAnalytics.date) == today
            )
        )
    ).first()
    
    if not analytics:
        analytics = PromptAnalytics(
            prompt_id=prompt_id,
            date=datetime.utcnow(),
            usage_count=0,
            success_count=0,
            avg_rating=0.0,
            avg_latency=0.0,
            total_tokens=0
        )
        session.add(analytics)
    
    analytics.usage_count += 1
    if success:
        analytics.success_count += 1
    
    # Update prompt-level stats
    prompt = session.get(Prompt, prompt_id)
    if prompt:
        prompt.usage_count += 1
        if success is not None:
            prompt.success_rate = (prompt.success_rate * (prompt.usage_count - 1) + (1 if success else 0)) / prompt.usage_count
    
    session.commit()


# Prompt CRUD operations
@router.post("/prompts/", response_model=PromptRead)
def create_prompt(prompt: PromptCreate, session: Session = Depends(get_session)):
    """Create a new prompt"""
    user_id = get_current_user_id()
    
    db_prompt = Prompt(
        title=prompt.title,
        content=prompt.content,
        description=prompt.description,
        category=prompt.category,
        tags=json.dumps(prompt.tags),
        privacy=prompt.privacy,
        user_id=user_id
    )
    
    session.add(db_prompt)
    session.commit()
    session.refresh(db_prompt)
    
    # Create initial version
    version = PromptVersion(
        prompt_id=db_prompt.id,
        version_number=1,
        content=prompt.content,
        changes_description="Initial version"
    )
    session.add(version)
    session.commit()
    
    # Convert tags back to list for response
    return convert_prompt_to_read(db_prompt)


@router.get("/prompts/", response_model=PaginatedPrompts)
def get_prompts(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    privacy: Optional[str] = None,
    search: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Get user's prompts with filtering"""
    user_id = get_current_user_id()
    
    query = select(Prompt).where(
        or_(
            Prompt.user_id == user_id,
            Prompt.privacy == "public"
        )
    )
    
    if category:
        query = query.where(Prompt.category == category)
    
    if privacy:
        query = query.where(Prompt.privacy == privacy)
    
    if search:
        query = query.where(
            or_(
                Prompt.title.contains(search),
                Prompt.content.contains(search),
                Prompt.description.contains(search)
            )
        )
    
    # Get total count
    total_query = select(func.count()).select_from(query.subquery())
    total = session.exec(total_query).one()
    
    # Get paginated results
    prompts = session.exec(query.offset(skip).limit(limit)).all()
    
    # Convert to response format
    items = []
    for prompt in prompts:
        items.append(convert_prompt_to_read(prompt))
    
    return PaginatedPrompts(
        items=items,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        pages=(total + limit - 1) // limit
    )


@router.get("/prompts/{prompt_id}", response_model=PromptRead)
def get_prompt(prompt_id: int, session: Session = Depends(get_session)):
    """Get a specific prompt"""
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    return convert_prompt_to_read(prompt)


@router.put("/prompts/{prompt_id}", response_model=PromptRead)
def update_prompt(prompt_id: int, prompt_update: PromptUpdate, session: Session = Depends(get_session)):
    """Update a prompt and create a new version"""
    user_id = get_current_user_id()
    
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    if prompt.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this prompt")
    
    # Create new version if content changed
    content_changed = False
    if prompt_update.content and prompt_update.content != prompt.content:
        content_changed = True
        
        # Get the latest version number
        latest_version = session.exec(
            select(func.max(PromptVersion.version_number)).where(
                PromptVersion.prompt_id == prompt_id
            )
        ).one() or 0
        
        # Create new version
        new_version = PromptVersion(
            prompt_id=prompt_id,
            version_number=latest_version + 1,
            content=prompt_update.content,
            changes_description="Updated content"
        )
        session.add(new_version)
    
    # Update prompt fields
    if prompt_update.title:
        prompt.title = prompt_update.title
    if prompt_update.content:
        prompt.content = prompt_update.content
    if prompt_update.description:
        prompt.description = prompt_update.description
    if prompt_update.category:
        prompt.category = prompt_update.category
    if prompt_update.tags:
        prompt.tags = json.dumps(prompt_update.tags)
    if prompt_update.status:
        prompt.status = prompt_update.status
    if prompt_update.privacy:
        prompt.privacy = prompt_update.privacy
    
    prompt.updated_at = datetime.utcnow()
    
    session.commit()
    session.refresh(prompt)
    
    return convert_prompt_to_read(prompt)


@router.delete("/prompts/{prompt_id}")
def delete_prompt(prompt_id: int, session: Session = Depends(get_session)):
    """Delete a prompt"""
    user_id = get_current_user_id()
    
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    if prompt.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this prompt")
    
    session.delete(prompt)
    session.commit()
    
    return {"message": "Prompt deleted successfully"}


# Prompt versioning
@router.get("/prompts/{prompt_id}/versions", response_model=List[PromptVersionRead])
def get_prompt_versions(prompt_id: int, session: Session = Depends(get_session)):
    """Get all versions of a prompt"""
    versions = session.exec(
        select(PromptVersion)
        .where(PromptVersion.prompt_id == prompt_id)
        .order_by(PromptVersion.version_number.desc())
    ).all()
    
    return [PromptVersionRead.model_validate(v) for v in versions]


@router.post("/prompts/{prompt_id}/revert/{version_number}", response_model=PromptRead)
def revert_prompt_to_version(
    prompt_id: int, 
    version_number: int, 
    session: Session = Depends(get_session)
):
    """Revert a prompt to a specific version"""
    user_id = get_current_user_id()
    
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    if prompt.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get the version to revert to
    version = session.exec(
        select(PromptVersion).where(
            and_(
                PromptVersion.prompt_id == prompt_id,
                PromptVersion.version_number == version_number
            )
        )
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Create new version with reverted content
    latest_version = session.exec(
        select(func.max(PromptVersion.version_number)).where(
            PromptVersion.prompt_id == prompt_id
        )
    ).one() or 0
    
    new_version = PromptVersion(
        prompt_id=prompt_id,
        version_number=latest_version + 1,
        content=version.content,
        changes_description=f"Reverted to version {version_number}"
    )
    session.add(new_version)
    
    # Update prompt content
    prompt.content = version.content
    prompt.updated_at = datetime.utcnow()
    
    session.commit()
    session.refresh(prompt)
    
    return convert_prompt_to_read(prompt)


# Prompt testing
@router.post("/prompts/test", response_model=TestPromptResponse)
def test_prompt(request: TestPromptRequest, session: Session = Depends(get_session)):
    """Test a prompt with sample input"""
    try:
        start_time = time.time()
        
        # Prepare the prompt
        full_prompt = request.prompt
        if request.sample_input:
            full_prompt += f"\n\nInput: {request.sample_input}"
        
        # Call OpenAI API (you'll need to configure this)
        try:
            response = openai_client.chat.completions.create(
                model=request.model,
                messages=[{"role": "user", "content": full_prompt}],
                temperature=request.temperature
            )
            
            # Extract response content
            response_text = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
        except Exception as e:
            # Fallback to mock response if OpenAI fails
            response_text = f"Mock response for prompt: {request.prompt[:50]}..."
            tokens_used = len(full_prompt.split()) + 20
        
        end_time = time.time()
        latency_ms = int((end_time - start_time) * 1000)
        
        return TestPromptResponse(
            prompt=request.prompt,
            sample_input=request.sample_input,
            response=response_text,
            model=request.model,
            tokens=tokens_used,
            latency_ms=latency_ms
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error testing prompt: {str(e)}")


# Prompt templates
@router.post("/templates/", response_model=PromptTemplateRead)
def create_template(template: PromptTemplateCreate, session: Session = Depends(get_session)):
    """Create a new prompt template"""
    db_template = PromptTemplate(
        name=template.name,
        description=template.description,
        template=template.template,
        category=template.category,
        tags=json.dumps(template.tags)
    )
    
    session.add(db_template)
    session.commit()
    session.refresh(db_template)
    
    return convert_template_to_read(db_template)


@router.get("/templates/", response_model=PaginatedTemplates)
def get_templates(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    search: Optional[str] = None,
    session: Session = Depends(get_session)
):
    """Get prompt templates"""
    query = select(PromptTemplate)
    
    if category:
        query = query.where(PromptTemplate.category == category)
    
    if search:
        query = query.where(
            or_(
                PromptTemplate.name.contains(search),
                PromptTemplate.description.contains(search),
                PromptTemplate.template.contains(search)
            )
        )
    
    # Get total count
    total_query = select(func.count()).select_from(query.subquery())
    total = session.exec(total_query).one()
    
    # Get paginated results
    templates = session.exec(
        query.order_by(PromptTemplate.usage_count.desc()).offset(skip).limit(limit)
    ).all()
    
    # Convert to response format
    items = []
    for template in templates:
        items.append(convert_template_to_read(template))
    
    return PaginatedTemplates(
        items=items,
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        pages=(total + limit - 1) // limit
    )


@router.post("/templates/{template_id}/use", response_model=PromptRead)
def use_template(
    template_id: int, 
    customizations: dict = {},
    session: Session = Depends(get_session)
):
    """Create a prompt from a template"""
    template = session.get(PromptTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Increment usage count
    template.usage_count += 1
    
    # Apply customizations to template
    content = template.template
    for key, value in customizations.items():
        content = content.replace(f"{{{key}}}", str(value))
    
    # Create prompt from template
    user_id = get_current_user_id()
    prompt = Prompt(
        title=f"From template: {template.name}",
        content=content,
        description=f"Created from template: {template.description}",
        category=template.category,
        tags=template.tags,
        user_id=user_id
    )
    
    session.add(prompt)
    session.commit()
    session.refresh(prompt)
    
    # Create initial version
    version = PromptVersion(
        prompt_id=prompt.id,
        version_number=1,
        content=content,
        changes_description=f"Created from template: {template.name}"
    )
    session.add(version)
    session.commit()
    
    return convert_prompt_to_read(prompt)


# Analytics and insights
@router.get("/prompts/{prompt_id}/analytics")
def get_prompt_analytics(prompt_id: int, session: Session = Depends(get_session)):
    """Get analytics for a specific prompt"""
    analytics = session.exec(
        select(PromptAnalytics)
        .where(PromptAnalytics.prompt_id == prompt_id)
        .order_by(PromptAnalytics.date.desc())
        .limit(30)
    ).all()
    
    return [
        {
            "date": a.date.isoformat(),
            "usage_count": a.usage_count,
            "success_count": a.success_count,
            "success_rate": a.success_count / a.usage_count if a.usage_count > 0 else 0,
            "avg_rating": a.avg_rating,
            "avg_latency": a.avg_latency,
            "total_tokens": a.total_tokens
        }
        for a in analytics
    ]


@router.get("/categories")
def get_categories(session: Session = Depends(get_session)):
    """Get available categories"""
    categories = session.exec(
        select(Prompt.category).distinct().where(Prompt.category.isnot(None))
    ).all()
    
    return [c for c in categories if c]


@router.get("/tags")
def get_tags(session: Session = Depends(get_session)):
    """Get available tags"""
    prompts = session.exec(select(Prompt.tags).where(Prompt.tags.isnot(None))).all()
    
    all_tags = set()
    for tags_str in prompts:
        if tags_str:
            tags = json.loads(tags_str)
            all_tags.update(tags)
    
    return sorted(list(all_tags))