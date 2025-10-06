from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os

router = APIRouter(prefix="/api/profile", tags=["profile"])

PROFILE_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
PROFILE_FILE = os.path.join(PROFILE_DIR, "profile.json")
CV_FILE = os.path.join(PROFILE_DIR, "cv_uploaded.pdf")

class ProfileForm(BaseModel):
    introduction: Optional[str] = None
    experiences: Optional[str] = None
    skills: Optional[str] = None
    volunteering: Optional[str] = None
    internships: Optional[str] = None
    studies: Optional[str] = None
    languages: Optional[str] = None

@router.post("/upload")
async def upload_profile(
    introduction: str = Form(...),
    experiences: str = Form(...),
    skills: str = Form(...),
    volunteering: str = Form(...),
    internships: str = Form(...),
    studies: str = Form(...),
    languages: str = Form(...),
    cv: UploadFile = File(None)
):
    # Save profile data
    profile = {
        "introduction": introduction,
        "experiences": experiences,
        "skills": skills,
        "volunteering": volunteering,
        "internships": internships,
        "studies": studies,
        "languages": languages,
    }
    os.makedirs(PROFILE_DIR, exist_ok=True)
    with open(PROFILE_FILE, "w", encoding="utf-8") as f:
        import json
        json.dump(profile, f, ensure_ascii=False, indent=2)
    # Save CV file
    if cv:
        ext = os.path.splitext(cv.filename)[-1]
        cv_path = os.path.join(PROFILE_DIR, f"cv_uploaded{ext}")
        with open(cv_path, "wb") as f:
            f.write(await cv.read())
    return JSONResponse({"ok": True, "profile": profile})

@router.get("/get")
async def get_profile():
    import json
    if not os.path.exists(PROFILE_FILE):
        return JSONResponse({"profile": None})
    with open(PROFILE_FILE, "r", encoding="utf-8") as f:
        profile = json.load(f)
    return JSONResponse({"profile": profile})
