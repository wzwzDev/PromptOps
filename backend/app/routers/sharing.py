"""
Router for prompt sharing and collaboration features.
"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, and_, func
from ..db import get_session
from ..models import Prompt, PromptShare, User, Feedback
from ..schemas import (
    PromptShareCreate, PromptShareRead, PromptRead, 
    FeedbackCreate, FeedbackRead, UserCreate, UserRead
)
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
import os


router = APIRouter()


def get_current_user_id() -> int:
    """Mock function - replace with actual auth"""
    return 1


def send_share_notification(email: str, prompt_title: str, sharer_name: str):
    """Send email notification for shared prompt"""
    try:
        # Configure SMTP (you'll need to set these environment variables)
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_password = os.getenv("SMTP_PASSWORD")
        
        if not smtp_user or not smtp_password:
            print("SMTP not configured, skipping email notification")
            return
        
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = email
        msg['Subject'] = f"Prompt shared with you: {prompt_title}"
        
        body = f"""
        Hello,
        
        {sharer_name} has shared a prompt with you: "{prompt_title}"
        
        You can access it in your PromptOps dashboard.
        
        Best regards,
        PromptOps Team
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_user, email, text)
        server.quit()
        
    except Exception as e:
        print(f"Failed to send email notification: {e}")


# User management
@router.post("/users/", response_model=UserRead)
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    """Create a new user"""
    # Check if username already exists
    existing = session.exec(
        select(User).where(User.username == user.username)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    db_user = User(
        username=user.username,
        email=user.email
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    return UserRead.model_validate(db_user)


@router.get("/users/search")
def search_users(
    query: str,
    limit: int = 10,
    session: Session = Depends(get_session)
):
    """Search for users by username or email"""
    users = session.exec(
        select(User).where(
            User.username.contains(query) | 
            User.email.contains(query)
        ).limit(limit)
    ).all()
    
    return [UserRead.model_validate(user) for user in users]


# Prompt sharing
@router.post("/prompts/{prompt_id}/share", response_model=PromptShareRead)
def share_prompt(
    prompt_id: int,
    share_data: PromptShareCreate,
    session: Session = Depends(get_session)
):
    """Share a prompt with another user or via email"""
    user_id = get_current_user_id()
    
    # Verify prompt ownership
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    if prompt.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to share this prompt")
    
    # Verify the prompt can be shared
    if prompt.privacy == "private":
        raise HTTPException(status_code=400, detail="Cannot share private prompt")
    
    # Check if already shared with this user/email
    existing_share = session.exec(
        select(PromptShare).where(
            and_(
                PromptShare.prompt_id == prompt_id,
                PromptShare.shared_with_user_id == share_data.shared_with_user_id
                if share_data.shared_with_user_id 
                else PromptShare.shared_with_email == share_data.shared_with_email
            )
        )
    ).first()
    
    if existing_share:
        raise HTTPException(status_code=400, detail="Prompt already shared with this user")
    
    # Create share record
    db_share = PromptShare(
        prompt_id=prompt_id,
        shared_with_user_id=share_data.shared_with_user_id,
        shared_with_email=share_data.shared_with_email,
        permission_level=share_data.permission_level,
        expires_at=share_data.expires_at
    )
    
    session.add(db_share)
    session.commit()
    session.refresh(db_share)
    
    # Send notification if sharing via email
    if share_data.shared_with_email:
        current_user = session.get(User, user_id)
        send_share_notification(
            share_data.shared_with_email,
            prompt.title,
            current_user.username if current_user else "Someone"
        )
    
    return PromptShareRead.model_validate(db_share)


@router.get("/prompts/{prompt_id}/shares", response_model=List[PromptShareRead])
def get_prompt_shares(
    prompt_id: int,
    session: Session = Depends(get_session)
):
    """Get all shares for a prompt"""
    user_id = get_current_user_id()
    
    # Verify ownership
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    if prompt.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    shares = session.exec(
        select(PromptShare).where(PromptShare.prompt_id == prompt_id)
    ).all()
    
    return [PromptShareRead.model_validate(share) for share in shares]


@router.delete("/shares/{share_id}")
def revoke_share(share_id: int, session: Session = Depends(get_session)):
    """Revoke a prompt share"""
    user_id = get_current_user_id()
    
    share = session.get(PromptShare, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    # Verify ownership of the shared prompt
    prompt = session.get(Prompt, share.prompt_id)
    if prompt.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    session.delete(share)
    session.commit()
    
    return {"message": "Share revoked successfully"}


@router.get("/shared-with-me", response_model=List[PromptRead])
def get_shared_prompts(
    skip: int = 0,
    limit: int = 20,
    session: Session = Depends(get_session)
):
    """Get prompts shared with the current user"""
    user_id = get_current_user_id()
    current_user = session.get(User, user_id)
    
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get shares by user ID
    shares_by_user = session.exec(
        select(PromptShare).where(
            and_(
                PromptShare.shared_with_user_id == user_id,
                (PromptShare.expires_at.is_(None) | (PromptShare.expires_at > datetime.utcnow()))
            )
        )
    ).all()
    
    # Get shares by email
    shares_by_email = []
    if current_user.email:
        shares_by_email = session.exec(
            select(PromptShare).where(
                and_(
                    PromptShare.shared_with_email == current_user.email,
                    (PromptShare.expires_at.is_(None) | (PromptShare.expires_at > datetime.utcnow()))
                )
            )
        ).all()
    
    # Combine and get unique prompt IDs
    all_shares = shares_by_user + shares_by_email
    prompt_ids = list(set([share.prompt_id for share in all_shares]))
    
    if not prompt_ids:
        return []
    
    # Get the actual prompts
    prompts = session.exec(
        select(Prompt).where(Prompt.id.in_(prompt_ids)).offset(skip).limit(limit)
    ).all()
    
    results = []
    for prompt in prompts:
        result = PromptRead.model_validate(prompt)
        result.tags = json.loads(prompt.tags) if prompt.tags else []
        results.append(result)
    
    return results


# Collaboration features
@router.post("/prompts/{prompt_id}/feedback", response_model=FeedbackRead)
def add_feedback(
    prompt_id: int,
    feedback: FeedbackCreate,
    session: Session = Depends(get_session)
):
    """Add feedback to a prompt"""
    user_id = get_current_user_id()
    
    # Verify prompt exists and user has access
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # Check if user has access (owner, shared with them, or public)
    has_access = (
        prompt.user_id == user_id or
        prompt.privacy == "public" or
        session.exec(
            select(PromptShare).where(
                and_(
                    PromptShare.prompt_id == prompt_id,
                    (PromptShare.shared_with_user_id == user_id) |
                    (PromptShare.shared_with_email == session.get(User, user_id).email)
                )
            )
        ).first() is not None
    )
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to provide feedback")
    
    # Check if user already provided feedback for this prompt
    existing_feedback = session.exec(
        select(Feedback).where(
            and_(
                Feedback.prompt_id == prompt_id,
                Feedback.user_id == user_id
            )
        )
    ).first()
    
    if existing_feedback:
        # Update existing feedback
        existing_feedback.rating = feedback.rating
        existing_feedback.comment = feedback.comment
        existing_feedback.helpful = feedback.helpful
        existing_feedback.created_at = datetime.utcnow()
        
        session.commit()
        session.refresh(existing_feedback)
        
        db_feedback = existing_feedback
    else:
        # Create new feedback
        db_feedback = Feedback(
            rating=feedback.rating,
            comment=feedback.comment,
            helpful=feedback.helpful,
            prompt_id=prompt_id,
            user_id=user_id
        )
        
        session.add(db_feedback)
        session.commit()
        session.refresh(db_feedback)
    
    # Update prompt's average rating
    avg_rating = session.exec(
        select(func.avg(Feedback.rating)).where(Feedback.prompt_id == prompt_id)
    ).one()
    
    prompt.avg_rating = float(avg_rating) if avg_rating else 0.0
    session.commit()
    
    return FeedbackRead.model_validate(db_feedback)


@router.get("/prompts/{prompt_id}/feedback", response_model=List[FeedbackRead])
def get_prompt_feedback(
    prompt_id: int,
    skip: int = 0,
    limit: int = 20,
    session: Session = Depends(get_session)
):
    """Get feedback for a prompt"""
    user_id = get_current_user_id()
    
    # Verify prompt exists and user has access
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # Check access (same logic as add_feedback)
    has_access = (
        prompt.user_id == user_id or
        prompt.privacy == "public" or
        session.exec(
            select(PromptShare).where(
                and_(
                    PromptShare.prompt_id == prompt_id,
                    (PromptShare.shared_with_user_id == user_id) |
                    (PromptShare.shared_with_email == session.get(User, user_id).email)
                )
            )
        ).first() is not None
    )
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to view feedback")
    
    feedback_list = session.exec(
        select(Feedback)
        .where(Feedback.prompt_id == prompt_id)
        .order_by(Feedback.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    
    return [FeedbackRead.model_validate(fb) for fb in feedback_list]


@router.get("/prompts/{prompt_id}/collaborators")
def get_prompt_collaborators(
    prompt_id: int,
    session: Session = Depends(get_session)
):
    """Get list of users who have access to a prompt"""
    user_id = get_current_user_id()
    
    # Verify ownership
    prompt = session.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    if prompt.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all shares
    shares = session.exec(
        select(PromptShare).where(PromptShare.prompt_id == prompt_id)
    ).all()
    
    collaborators = []
    
    # Add owner
    owner = session.get(User, prompt.user_id)
    if owner:
        collaborators.append({
            "user": UserRead.model_validate(owner),
            "permission_level": "admin",
            "shared_at": prompt.created_at,
            "is_owner": True
        })
    
    # Add shared users
    for share in shares:
        user_data = None
        if share.shared_with_user_id:
            user = session.get(User, share.shared_with_user_id)
            if user:
                user_data = UserRead.model_validate(user)
        
        collaborators.append({
            "user": user_data,
            "email": share.shared_with_email,
            "permission_level": share.permission_level,
            "shared_at": share.created_at,
            "expires_at": share.expires_at,
            "is_owner": False
        })
    
    return collaborators


@router.post("/prompts/{prompt_id}/duplicate", response_model=PromptRead)
def duplicate_shared_prompt(
    prompt_id: int,
    session: Session = Depends(get_session)
):
    """Duplicate a shared prompt to your own collection"""
    user_id = get_current_user_id()
    
    # Get the original prompt
    original_prompt = session.get(Prompt, prompt_id)
    if not original_prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # Check if user has access to this prompt
    has_access = (
        original_prompt.privacy == "public" or
        session.exec(
            select(PromptShare).where(
                and_(
                    PromptShare.prompt_id == prompt_id,
                    (PromptShare.shared_with_user_id == user_id) |
                    (PromptShare.shared_with_email == session.get(User, user_id).email)
                )
            )
        ).first() is not None
    )
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Not authorized to duplicate this prompt")
    
    # Create duplicate
    duplicate = Prompt(
        title=f"Copy of {original_prompt.title}",
        content=original_prompt.content,
        description=f"Duplicated from: {original_prompt.description or original_prompt.title}",
        category=original_prompt.category,
        tags=original_prompt.tags,
        privacy="private",  # Always create as private
        user_id=user_id
    )
    
    session.add(duplicate)
    session.commit()
    session.refresh(duplicate)
    
    # Create initial version
    from ..models import PromptVersion
    version = PromptVersion(
        prompt_id=duplicate.id,
        version_number=1,
        content=duplicate.content,
        changes_description=f"Duplicated from prompt {prompt_id}"
    )
    session.add(version)
    session.commit()
    
    result = PromptRead.model_validate(duplicate)
    result.tags = json.loads(duplicate.tags) if duplicate.tags else []
    
    return result