import anthropic
import json
from app.config import settings


client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None


async def analyze_job_match(job_description: str, job_requirements: str, resume_text: str) -> dict:
    """Use Claude to score how well a resume matches a job posting."""
    if not client:
        return {"score": 0.0, "summary": "AI analysis unavailable", "strengths": [], "gaps": []}

    prompt = f"""You are an expert ATS (Applicant Tracking System) analyzer. 
Analyze how well this resume matches the job posting and return a JSON response.

JOB TITLE & DESCRIPTION:
{job_description}

JOB REQUIREMENTS:
{job_requirements}

CANDIDATE RESUME:
{resume_text}

Return ONLY a valid JSON object with this structure:
{{
  "score": <float 0.0-100.0>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "gaps": ["<gap 1>", "<gap 2>", ...],
  "matched_skills": ["<skill>", ...],
  "missing_skills": ["<skill>", ...],
  "recommendation": "<hire|maybe|pass>"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text.strip()
    # Strip markdown fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


async def generate_job_description(title: str, company: str, skills: list, job_type: str) -> dict:
    """Use Claude to generate a professional job description."""
    if not client:
        return {"description": "", "requirements": "", "responsibilities": ""}

    prompt = f"""Generate a professional, compelling job posting for:
- Job Title: {title}
- Company: {company}
- Job Type: {job_type}
- Required Skills: {', '.join(skills)}

Return ONLY a valid JSON object:
{{
  "description": "<engaging 2-3 paragraph company and role overview>",
  "requirements": "<bullet-point requirements>",
  "responsibilities": "<bullet-point responsibilities>"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())
