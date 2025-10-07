"""
Seed script to populate the database with default prompt templates.
"""
from app.db import init_db, get_session
from app.models import PromptTemplate, User
from sqlmodel import select
import json


def create_default_templates():
    """Create default prompt templates for career tools"""
    session = next(get_session())
    
    # Check if templates already exist
    existing = session.exec(select(PromptTemplate)).first()
    if existing:
        print("Templates already exist, skipping seed")
        return
    
    templates = [
        {
            "name": "Job Application Cover Letter",
            "description": "Generate a compelling cover letter for job applications",
            "template": """Write a professional cover letter for the following job application:

Job Title: {job_title}
Company: {company_name}
Your Background: {background}
Key Skills: {skills}
Why you're interested: {interest_reason}

Make it compelling, specific, and professional. Highlight relevant experience and show enthusiasm for the role.""",
            "category": "Job Search",
            "tags": ["cover-letter", "job-application", "career"]
        },
        {
            "name": "Interview Preparation Questions",
            "description": "Generate practice interview questions for specific roles",
            "template": """Generate 10 challenging interview questions for a {job_title} position at a {company_type} company.

Focus on:
- Technical skills: {technical_skills}
- Experience level: {experience_level}
- Industry: {industry}

Include a mix of technical, behavioral, and situational questions. Provide brief guidance on what interviewers are looking for in each answer.""",
            "category": "Interview Prep",
            "tags": ["interview", "questions", "preparation", "career"]
        },
        {
            "name": "Resume Skills Summary",
            "description": "Create a compelling skills summary for your resume",
            "template": """Create a professional skills summary for a resume targeting {target_role} positions.

Background:
- Current role: {current_role}
- Years of experience: {years_experience}
- Key achievements: {achievements}
- Technical skills: {technical_skills}
- Industry: {industry}

Write a concise, impactful summary that highlights relevant skills and accomplishments. Keep it between 3-4 sentences.""",
            "category": "Resume",
            "tags": ["resume", "skills", "summary", "career"]
        },
        {
            "name": "LinkedIn Profile Optimization",
            "description": "Optimize your LinkedIn profile for better visibility",
            "template": """Help me optimize my LinkedIn profile for {target_industry} roles.

Current Information:
- Headline: {current_headline}
- Experience: {experience_summary}
- Skills: {skills}
- Goals: {career_goals}

Provide:
1. An improved headline
2. A compelling summary section
3. Skills recommendations
4. Content strategy suggestions""",
            "category": "LinkedIn",
            "tags": ["linkedin", "profile", "networking", "career"]
        },
        {
            "name": "Career Change Strategy",
            "description": "Plan a strategic career transition",
            "template": """I'm planning to transition from {current_field} to {target_field}.

Current situation:
- Experience: {current_experience}
- Transferable skills: {transferable_skills}
- Education/certifications: {education}
- Timeline: {timeline}
- Concerns: {concerns}

Create a strategic plan including:
1. Skills gap analysis
2. Learning recommendations
3. Networking strategy
4. Timeline with milestones
5. Job search approach""",
            "category": "Career Planning",
            "tags": ["career-change", "strategy", "planning", "transition"]
        },
        {
            "name": "Salary Negotiation Prep",
            "description": "Prepare for salary negotiations",
            "template": """Help me prepare for salary negotiation for a {position} role.

Details:
- Current salary: {current_salary}
- Offered salary: {offered_salary}
- Market research: {market_rate}
- Your value proposition: {value_proposition}
- Company size/type: {company_type}

Provide:
1. Negotiation strategy
2. Key talking points
3. Alternative benefits to consider
4. Scripts for different scenarios
5. Backup plans""",
            "category": "Negotiation",
            "tags": ["salary", "negotiation", "compensation", "career"]
        },
        {
            "name": "Performance Review Preparation",
            "description": "Prepare for annual performance reviews",
            "template": """Help me prepare for my annual performance review.

Role: {job_title}
Review period: {review_period}
Key achievements: {achievements}
Challenges faced: {challenges}
Goals for next period: {future_goals}
Desired outcomes: {desired_outcomes}

Create:
1. Achievement summary with metrics
2. Growth areas and improvement plans
3. Goals for the next review period
4. Talking points for salary/promotion discussion""",
            "category": "Performance",
            "tags": ["performance-review", "achievements", "goals", "career"]
        },
        {
            "name": "Networking Message Template",
            "description": "Craft effective networking messages",
            "template": """Create a networking message for {platform} to connect with {target_person}.

Context:
- Your background: {your_background}
- Their role/company: {their_role}
- Connection reason: {connection_reason}
- Your goal: {networking_goal}
- Mutual connections: {mutual_connections}

Write a personalized, professional message that:
1. Establishes credibility
2. Shows genuine interest
3. Provides clear value
4. Includes a specific ask
5. Is concise and respectful""",
            "category": "Networking",
            "tags": ["networking", "outreach", "linkedin", "career"]
        },
        {
            "name": "Skills Gap Analysis",
            "description": "Analyze skills needed for career advancement",
            "template": """Conduct a skills gap analysis for advancing to {target_position}.

Current role: {current_role}
Target role: {target_position}
Industry: {industry}
Current skills: {current_skills}
Experience level: {experience_level}

Provide:
1. Skills required for target role
2. Skills gap identification
3. Learning priorities (high/medium/low)
4. Recommended resources and courses
5. Timeline for skill development
6. Ways to gain practical experience""",
            "category": "Skill Development",
            "tags": ["skills", "analysis", "development", "career-growth"]
        },
        {
            "name": "Team Leadership Vision",
            "description": "Develop leadership vision and strategy",
            "template": """Help me develop a leadership vision for my {team_type} team.

Context:
- Team size: {team_size}
- Current challenges: {challenges}
- Business goals: {business_goals}
- Team strengths: {team_strengths}
- Areas for improvement: {improvement_areas}
- Timeline: {timeline}

Create:
1. Leadership vision statement
2. Team development strategy
3. Communication plan
4. Key performance indicators
5. Implementation roadmap
6. Change management approach""",
            "category": "Leadership",
            "tags": ["leadership", "team-management", "vision", "strategy"]
        }
    ]
    
    # Create templates
    for template_data in templates:
        template = PromptTemplate(
            name=template_data["name"],
            description=template_data["description"],
            template=template_data["template"],
            category=template_data["category"],
            tags=json.dumps(template_data["tags"])
        )
        session.add(template)
    
    # Create a default user
    default_user = User(
        username="demo_user",
        email="demo@promptops.com"
    )
    session.add(default_user)
    
    session.commit()
    print(f"Created {len(templates)} default templates and 1 demo user")


if __name__ == "__main__":
    init_db()
    create_default_templates()