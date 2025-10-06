from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
import json
import openai
from docxtpl import DocxTemplate
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/career", tags=["career"])

class TailorRequest(BaseModel):
    job_description: str
    company: Optional[str] = None
    recruiter: Optional[str] = None

@router.post("/generate")
async def generate_tailored_cv(request: TailorRequest):
    profile_path = os.path.join(os.path.dirname(__file__), "..", "data", "profile.json")
    if not os.path.exists(profile_path):
        return JSONResponse({"error": "No profile uploaded yet."}, status_code=400)
    with open(profile_path, "r", encoding="utf-8") as f:
        profile = json.load(f)

        # Compose prompt for OpenAI with CV template
        prompt = f"""
You are an expert career coach and CV writer. Given the following user profile and a job description, generate:
1. A tailored CV that highlights the user's most relevant experiences, skills, and background for the job, following the template below.
2. A cover letter that matches the job description and company, and addresses the recruiter if provided.

User Profile:
Introduction: {profile.get('introduction', '')}
Experiences: {profile.get('experiences', '')}
Skills: {profile.get('skills', '')}
Volunteering: {profile.get('volunteering', '')}
Internships: {profile.get('internships', '')}
Studies: {profile.get('studies', '')}
Languages: {profile.get('languages', '')}

Job Description: {request.job_description}
Company: {request.company or ''}
Recruiter: {request.recruiter or ''}

CV Template Example:
---------------------
Name: [Your Name]
Contact Information: [Email, Phone, LinkedIn]

Professional Summary:
[A brief summary tailored to the job]

Work Experience:
- [Job Title], [Company], [Dates]
    - [Key achievements and responsibilities]
- [Job Title], [Company], [Dates]
    - [Key achievements and responsibilities]

Education:
- [Degree], [Institution], [Year]

Skills:
- [Skill 1], [Skill 2], [Skill 3]

Certifications:
- [Certification Name], [Year]

Languages:
- [Language 1] (Level), [Language 2] (Level)

Volunteering & Internships:
- [Role], [Organization], [Dates]

Return your answer in strict JSON format:
{{"cv": "...tailored CV using the template above...", "cover_letter": "...tailored cover letter..."}}
---------------------
"""

    # Call OpenAI API
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1200,
            temperature=0.7,
        )
        text = response.choices[0].message.content
        # Extract JSON from response
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            snippet = text[start:end+1]
            data = json.loads(snippet)
            # Generate DOCX from CV text
            doc_template_path = os.path.join(os.path.dirname(__file__), "..", "data", "cv_template.docx")
            output_path = os.path.join(os.path.dirname(__file__), "..", "data", "cv_generated.docx")
            if os.path.exists(doc_template_path):
                doc = DocxTemplate(doc_template_path)
                context = {"cv": data["cv"]}
                doc.render(context)
                doc.save(output_path)
                data["cv_docx_path"] = output_path
            return JSONResponse(data)
        else:
            return JSONResponse({"error": "AI response not in expected format.", "raw": text}, status_code=500)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@router.post("/interview-questions")
async def generate_interview_questions(request: Request):
    data = await request.json()
    profile = data.get("profile", "")
    job_description = data.get("job_description", "")
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    prompt = (
        "You are an expert recruiter. Based on the following candidate profile and job description, generate a list of 10 likely interview questions that the candidate should expect. "
        "Focus on technical, behavioral, and company-specific aspects.\n"
        f"Candidate Profile: {profile}\nJob Description: {job_description}"
    )
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=512,
            temperature=0.7
        )
        questions = response.choices[0].message.content.strip()
        return JSONResponse({"questions": questions.split("\n")})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

# Download endpoint for generated CV DOCX
@router.get("/download_cv")
async def download_cv():
    output_path = os.path.join(os.path.dirname(__file__), "..", "data", "cv_generated.docx")
    if not os.path.exists(output_path):
        return JSONResponse({"error": "No generated CV found."}, status_code=404)
    return FileResponse(output_path, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename="tailored_cv.docx")
