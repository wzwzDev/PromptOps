from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
from io import BytesIO
from pdfminer.high_level import extract_text

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
    # If PDF CV is uploaded, extract text and try to auto-populate fields
    if cv and cv.filename.lower().endswith(".pdf"):
        pdf_bytes = await cv.read()
        text = extract_text(BytesIO(pdf_bytes))
        # Simple extraction: assign all text to introduction, user can edit later
        profile["introduction"] = text.strip()
        # Save PDF file
        ext = os.path.splitext(cv.filename)[-1]
        cv_path = os.path.join(PROFILE_DIR, f"cv_uploaded{ext}")
        with open(cv_path, "wb") as f:
            f.write(pdf_bytes)
    else:
        # Save non-PDF CV file if present
        if cv:
            ext = os.path.splitext(cv.filename)[-1]
            cv_path = os.path.join(PROFILE_DIR, f"cv_uploaded{ext}")
            with open(cv_path, "wb") as f:
                f.write(await cv.read())
    with open(PROFILE_FILE, "w", encoding="utf-8") as f:
        import json
        json.dump(profile, f, ensure_ascii=False, indent=2)
    return JSONResponse({"ok": True, "profile": profile})

@router.get("/get")
async def get_profile():
    import json
    if not os.path.exists(PROFILE_FILE):
        return JSONResponse({"profile": None})
    with open(PROFILE_FILE, "r", encoding="utf-8") as f:
        profile = json.load(f)
    return JSONResponse({"profile": profile})
