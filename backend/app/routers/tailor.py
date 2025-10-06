from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
import json

router = APIRouter(prefix="/api/tailor", tags=["tailor"])

class TailorRequest(BaseModel):
    job_description: str
    company: Optional[str] = None
    recruiter: Optional[str] = None

@router.post("/generate")
async def generate_tailored_cv(request: TailorRequest):
    # Load profile
    profile_path = os.path.join(os.path.dirname(__file__), "..", "data", "profile.json")
    if not os.path.exists(profile_path):
        return JSONResponse({"error": "No profile uploaded yet."}, status_code=400)
    with open(profile_path, "r", encoding="utf-8") as f:
        profile = json.load(f)
    # TODO: Integrate LLM and web search for real tailoring
    # For now, return a mock tailored CV and cover letter
    tailored_cv = f"Tailored CV for {request.company or 'the job'}\n\nIntroduction: {profile.get('introduction', '')}\nExperiences: {profile.get('experiences', '')}\nSkills: {profile.get('skills', '')}\nVolunteering: {profile.get('volunteering', '')}\nInternships: {profile.get('internships', '')}\nStudies: {profile.get('studies', '')}\nLanguages: {profile.get('languages', '')}\n\nJob Description: {request.job_description}"
    cover_letter = f"Dear {request.recruiter or 'Recruiter'},\n\nI am excited to apply for the position at {request.company or 'your company'}. My background and skills match the job description: {request.job_description}.\n\nBest regards,\n[Your Name]"
    return JSONResponse({"cv": tailored_cv, "cover_letter": cover_letter})
