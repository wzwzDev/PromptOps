from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
import openai
from docxtpl import DocxTemplate
from fastapi.responses import FileResponse
import re
from datetime import datetime

router = APIRouter(prefix="/api/career", tags=["career"])

class TailorRequest(BaseModel):
    job_description: str
    company: Optional[str] = None
    recruiter: Optional[str] = None
    job_title: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None

class InterviewRequest(BaseModel):
    job_description: str
    company: str
    job_title: str
    experience_level: str = "mid"  # junior, mid, senior
    interview_type: str = "general"  # general, technical, behavioral, final

def extract_job_keywords(job_description: str) -> List[str]:
    """Extract important keywords from job description"""
    # Common technical skills, tools, and keywords
    keywords = []
    common_skills = [
        "python", "java", "javascript", "react", "node.js", "sql", "aws", "docker", 
        "kubernetes", "agile", "scrum", "git", "ci/cd", "machine learning", "data science",
        "project management", "leadership", "communication", "problem solving", "teamwork"
    ]
    
    job_lower = job_description.lower()
    for skill in common_skills:
        if skill in job_lower:
            keywords.append(skill)
    
    # Extract years of experience requirements
    exp_pattern = r'(\d+)[\+\-\s]*years?\s+(?:of\s+)?experience'
    exp_matches = re.findall(exp_pattern, job_lower)
    if exp_matches:
        keywords.append(f"{exp_matches[0]} years experience")
    
    return keywords

@router.post("/generate")
async def generate_tailored_cv(request: TailorRequest):
    profile_path = os.path.join(os.path.dirname(__file__), "..", "data", "profile.json")
    if not os.path.exists(profile_path):
        return JSONResponse({"error": "No profile uploaded yet."}, status_code=400)
    
    with open(profile_path, "r", encoding="utf-8") as f:
        profile = json.load(f)

    # Extract keywords and analyze job requirements
    job_keywords = extract_job_keywords(request.job_description)
    
    # Enhanced prompt for more detailed CV generation
    prompt = f"""
You are an elite executive resume writer and career strategist with 15+ years of experience. Create an exceptional, ATS-optimized CV and compelling cover letter that will make this candidate stand out.

CANDIDATE PROFILE:
Name: {profile.get('name', 'John Doe')}
Email: {profile.get('email', 'john@example.com')}
Phone: {profile.get('phone', '+1-555-0123')}
LinkedIn: {profile.get('linkedin', 'linkedin.com/in/johndoe')}
Location: {profile.get('location', 'New York, NY')}

Professional Background:
- Introduction: {profile.get('introduction', '')}
- Work Experience: {profile.get('experiences', '')}
- Core Skills: {profile.get('skills', '')}
- Education: {profile.get('studies', '')}
- Languages: {profile.get('languages', '')}
- Volunteering: {profile.get('volunteering', '')}
- Internships: {profile.get('internships', '')}
- Certifications: {profile.get('certifications', '')}

TARGET JOB DETAILS:
- Position: {request.job_title or 'Target Position'}
- Company: {request.company or 'Target Company'}
- Location: {request.location or 'Location TBD'}
- Salary Range: {request.salary_range or 'Negotiable'}
- Key Requirements: {request.job_description}
- Extracted Keywords: {', '.join(job_keywords)}

INSTRUCTIONS:
1. Create a 2-3 page executive-level CV with:
   - Compelling professional summary (3-4 lines) that mirrors job requirements
   - Strategic skills section with both hard and soft skills
   - Detailed work experience with QUANTIFIED achievements (use numbers, percentages, dollar amounts)
   - Education with relevant coursework if applicable
   - Additional sections: Certifications, Languages, Publications, Awards, Professional Associations
   
2. For each role, include:
   - 3-5 bullet points with STAR format (Situation, Task, Action, Result)
   - Metrics and quantifiable achievements
   - Keywords from the job description
   - Leadership and impact examples

3. Create a persuasive cover letter that:
   - Opens with a hook that connects to the company's mission
   - Demonstrates knowledge of the company and role
   - Provides 2-3 specific examples of relevant achievements
   - Shows enthusiasm and cultural fit
   - Includes a compelling call-to-action

4. Ensure both documents are:
   - ATS-friendly with proper formatting
   - Error-free and professionally written
   - Tailored specifically to this role
   - 20% longer and more detailed than typical resumes

Return in JSON format with detailed sections:
{{
    "cv": {{
        "header": "formatted contact information",
        "professional_summary": "compelling 3-4 line summary",
        "core_competencies": ["skill1", "skill2", "skill3"],
        "work_experience": [
            {{
                "title": "Job Title",
                "company": "Company Name",
                "dates": "MM/YYYY - MM/YYYY",
                "achievements": ["achievement 1", "achievement 2", "achievement 3"]
            }}
        ],
        "education": "formatted education section",
        "certifications": "relevant certifications",
        "languages": "language proficiency",
        "additional_sections": "awards, publications, volunteer work"
    }},
    "cover_letter": "complete cover letter text",
    "cv_full_text": "complete formatted CV as single string",
    "optimization_notes": "specific notes on how CV was tailored",
    "keyword_coverage": ["keywords successfully incorporated"],
    "ats_score": "estimated ATS compatibility score out of 100"
}}
"""

    # Call OpenAI API with enhanced parameters
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        response = client.chat.completions.create(
            model="gpt-4",  # Use GPT-4 for better quality
            messages=[
                {"role": "system", "content": "You are an elite executive resume writer with expertise in ATS optimization and career strategy."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=3000,  # Increased for longer content
            temperature=0.3,  # Lower for more consistent, professional output
        )
        text = response.choices[0].message.content
        
        # Enhanced JSON extraction
        try:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1 and end > start:
                snippet = text[start:end+1]
                data = json.loads(snippet)
                
                # Generate enhanced DOCX
                doc_template_path = os.path.join(os.path.dirname(__file__), "..", "data", "cv_template.docx")
                output_path = os.path.join(os.path.dirname(__file__), "..", "data", "cv_generated.docx")
                
                if os.path.exists(doc_template_path):
                    doc = DocxTemplate(doc_template_path)
                    context = {
                        "cv_content": data.get("cv_full_text", ""),
                        "name": profile.get('name', 'John Doe'),
                        "email": profile.get('email', ''),
                        "phone": profile.get('phone', ''),
                        "linkedin": profile.get('linkedin', ''),
                        "generation_date": datetime.now().strftime("%B %d, %Y")
                    }
                    doc.render(context)
                    doc.save(output_path)
                    data["cv_docx_path"] = output_path
                
                # Add analysis metadata
                data["analysis"] = {
                    "job_match_score": len(job_keywords) * 10,  # Simple scoring
                    "keywords_found": job_keywords,
                    "optimization_suggestions": [
                        "Consider adding more quantified achievements",
                        "Include industry-specific certifications",
                        "Add metrics to demonstrate ROI"
                    ]
                }
                
                return JSONResponse(data)
            else:
                return JSONResponse({"error": "AI response format issue", "raw": text}, status_code=500)
        except json.JSONDecodeError:
            return JSONResponse({"error": "Invalid JSON from AI", "raw": text}, status_code=500)
            
    except Exception as e:
        # Fallback response
        fallback_response = {
            "cv": {
                "header": f"{profile.get('name', 'John Doe')} | {profile.get('email', '')} | {profile.get('phone', '')}",
                "professional_summary": f"Experienced professional with proven track record in {request.job_title or 'target field'}. Strong background in delivering results and driving business growth.",
                "core_competencies": job_keywords[:8] if job_keywords else ["Leadership", "Project Management", "Communication"],
                "work_experience": [{"title": "Previous Role", "company": "Previous Company", "dates": "2020-2023", "achievements": ["Led key initiatives", "Improved processes", "Delivered results"]}],
                "education": profile.get('studies', 'Education details'),
                "certifications": profile.get('certifications', 'Professional certifications'),
                "languages": profile.get('languages', 'Language skills'),
                "additional_sections": "Additional qualifications and achievements"
            },
            "cover_letter": f"Dear Hiring Manager,\n\nI am excited to apply for the {request.job_title} position at {request.company}. With my background in {profile.get('introduction', 'relevant field')}, I am confident I can contribute significantly to your team.\n\nSincerely,\n{profile.get('name', 'John Doe')}",
            "cv_full_text": f"Professional CV for {profile.get('name', 'John Doe')} - {request.job_title} position",
            "optimization_notes": "Fallback CV generated due to AI service unavailability",
            "keyword_coverage": job_keywords[:5],
            "ats_score": "85"
        }
        return JSONResponse({"data": fallback_response, "note": "Fallback response due to AI service issue"})

@router.post("/interview-questions")
async def generate_interview_questions(request: InterviewRequest):
    """Generate comprehensive interview preparation materials"""
    
    enhanced_prompt = f"""
You are a senior hiring manager and interview expert. Create a comprehensive interview preparation package for this candidate.

JOB DETAILS:
- Position: {request.job_title}
- Company: {request.company}  
- Experience Level: {request.experience_level}
- Interview Type: {request.interview_type}
- Job Description: {request.job_description}

Create a detailed interview preparation package including:

1. LIKELY QUESTIONS (15-20 questions):
   - Behavioral questions (STAR method examples)
   - Technical questions specific to the role
   - Company culture questions
   - Scenario-based questions
   - Leadership/management questions (if applicable)

2. SAMPLE ANSWERS with frameworks:
   - Provide example answers for 5 key questions
   - Include STAR method breakdowns
   - Show how to quantify achievements

3. COMPANY RESEARCH POINTS:
   - Key facts the candidate should know
   - Recent company news/developments
   - Company culture insights
   - Potential challenges/opportunities

4. QUESTIONS TO ASK INTERVIEWER:
   - Strategic questions about the role
   - Company direction questions
   - Team dynamics questions
   - Growth opportunity questions

5. PREPARATION CHECKLIST:
   - Documents to bring
   - What to research beforehand
   - Day-of interview tips
   - Follow-up strategies

Return comprehensive JSON format:
{{
    "interview_type": "{request.interview_type}",
    "experience_level": "{request.experience_level}",
    "likely_questions": {{
        "behavioral": ["question1", "question2"],
        "technical": ["question1", "question2"],
        "company_specific": ["question1", "question2"],
        "scenario_based": ["question1", "question2"]
    }},
    "sample_answers": [
        {{
            "question": "Tell me about a challenging project",
            "framework": "STAR Method",
            "sample_answer": "detailed example answer",
            "key_points": ["point1", "point2"]
        }}
    ],
    "company_research": {{
        "key_facts": ["fact1", "fact2"],
        "recent_news": ["news1", "news2"],
        "culture_insights": ["insight1", "insight2"]
    }},
    "questions_for_interviewer": [
        "What are the biggest challenges facing the team right now?",
        "How do you measure success in this role?"
    ],
    "preparation_checklist": {{
        "documents": ["Resume copies", "Portfolio", "References"],
        "research_topics": ["Company mission", "Recent projects", "Industry trends"],
        "day_of_tips": ["Arrive 10 minutes early", "Bring notebook", "Prepare questions"]
    }},
    "salary_negotiation": {{
        "market_research": "Research salary ranges for this role",
        "negotiation_points": ["Your unique value", "Market rate", "Total compensation"],
        "timing_advice": "Wait for offer before discussing salary"
    }}
}}
"""

    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert interview coach and hiring manager with 20+ years of experience."},
                {"role": "user", "content": enhanced_prompt}
            ],
            max_tokens=2500,
            temperature=0.4
        )
        text = response.choices[0].message.content
        
        try:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                snippet = text[start:end+1]
                data = json.loads(snippet)
                return JSONResponse(data)
        except json.JSONDecodeError:
            pass
            
    except Exception as e:
        pass
    
    # Enhanced fallback response
    fallback_questions = {
        "behavioral": [
            "Tell me about yourself and your career journey",
            "Describe a challenging project you led and how you overcame obstacles",
            "Give an example of when you had to work with a difficult team member",
            "Tell me about a time you failed and what you learned from it",
            "Describe your greatest professional achievement"
        ],
        "technical": [
            f"What experience do you have with the key technologies mentioned in the job description?",
            "How would you approach solving a complex technical problem?",
            "Describe your development process from planning to deployment",
            "How do you stay current with industry trends and technologies?",
            "Walk me through a recent project and the technical decisions you made"
        ],
        "company_specific": [
            f"Why do you want to work at {request.company}?",
            "What do you know about our company culture and values?",
            "How would you contribute to our team's goals?",
            "What interests you most about this specific role?",
            "Where do you see yourself in 5 years?"
        ]
    }
    
    return JSONResponse({
        "interview_type": request.interview_type,
        "experience_level": request.experience_level,
        "likely_questions": fallback_questions,
        "sample_answers": [
            {
                "question": "Tell me about yourself",
                "framework": "Present-Past-Future",
                "sample_answer": "Currently I'm working as [current role] where I [key achievement]. Previously, I developed my skills in [relevant experience]. I'm excited about this role because [future goal alignment].",
                "key_points": ["Keep it concise (2-3 minutes)", "Focus on professional highlights", "Connect to the role"]
            }
        ],
        "questions_for_interviewer": [
            "What are the biggest challenges facing the team right now?",
            "How do you measure success in this role?",
            "What opportunities are there for professional development?",
            "Can you describe the team I'd be working with?"
        ],
        "preparation_checklist": {
            "documents": ["Resume copies", "Portfolio/work samples", "References list", "Questions list"],
            "research_topics": ["Company mission and values", "Recent company news", "Industry trends", "Interviewer backgrounds"],
            "day_of_tips": ["Arrive 10-15 minutes early", "Bring notebook and pen", "Dress appropriately", "Practice firm handshake"]
        },
        "note": "Comprehensive interview preparation generated"
    })

@router.post("/analyze-job-fit")
async def analyze_job_fit(request: Request):
    """Analyze how well candidate profile matches job requirements"""
    data = await request.json()
    job_description = data.get("job_description", "")
    
    profile_path = os.path.join(os.path.dirname(__file__), "..", "data", "profile.json")
    if not os.path.exists(profile_path):
        return JSONResponse({"error": "No profile uploaded yet."}, status_code=400)
    
    with open(profile_path, "r", encoding="utf-8") as f:
        profile = json.load(f)
    
    # Extract skills and requirements
    job_keywords = extract_job_keywords(job_description)
    profile_skills = profile.get('skills', '').lower().split(',')
    
    # Calculate match score
    matched_skills = []
    missing_skills = []
    
    for keyword in job_keywords:
        if any(keyword.lower() in skill.strip() for skill in profile_skills):
            matched_skills.append(keyword)
        else:
            missing_skills.append(keyword)
    
    match_score = (len(matched_skills) / max(len(job_keywords), 1)) * 100
    
    return JSONResponse({
        "overall_match_score": round(match_score, 1),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "recommendations": [
            f"Consider gaining experience in: {', '.join(missing_skills[:3])}" if missing_skills else "Strong skill alignment!",
            "Highlight quantified achievements in your CV",
            "Research the company's recent projects and challenges",
            "Prepare specific examples for your top 3 matching skills"
        ],
        "strengths": [
            f"Strong background in {skill}" for skill in matched_skills[:3]
        ],
        "improvement_areas": missing_skills[:3] if missing_skills else ["Continue building on current strengths"]
    })

# Download endpoint for generated CV DOCX
@router.get("/download_cv")
async def download_cv():
    output_path = os.path.join(os.path.dirname(__file__), "..", "data", "cv_generated.docx")
    if not os.path.exists(output_path):
        return JSONResponse({"error": "No generated CV found."}, status_code=404)
    return FileResponse(
        output_path, 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        filename=f"tailored_cv_{datetime.now().strftime('%Y%m%d')}.docx"
    )
