import openai
import json
import io
from app.config import settings

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

_openai_key = settings.OPENAI_API_KEY
client = openai.OpenAI(api_key=_openai_key) if _openai_key else None


def extract_text_from_pdf(content: bytes) -> str:
    if not PDF_AVAILABLE:
        return ""
    try:
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        return ""


def extract_text_from_docx(content: bytes) -> str:
    if not DOCX_AVAILABLE:
        return ""
    try:
        doc = Document(io.BytesIO(content))
        return "\n".join(para.text for para in doc.paragraphs)
    except Exception:
        return ""


async def analyze_resume(text: str) -> dict:
    """Use OpenAI to parse and analyze a resume."""
    if not client or not text:
        return {"skills": [], "experience_years": 0, "summary": "", "parsed_data": {}}

    prompt = f"""You are an expert resume parser and career coach. Analyze this resume and return structured data.

RESUME TEXT:
{text[:4000]}

Return ONLY valid JSON with this structure:
{{
  "full_name": "<name or empty>",
  "email": "<email or empty>",
  "phone": "<phone or empty>",
  "location": "<location or empty>",
  "summary": "<2-3 sentence professional summary you write based on their experience>",
  "experience_years": <estimated total years as float>,
  "current_title": "<most recent job title>",
  "skills": ["<skill1>", "<skill2>", ...],
  "education": [
    {{"degree": "", "institution": "", "year": ""}}
  ],
  "work_experience": [
    {{"title": "", "company": "", "duration": "", "highlights": [""]}}
  ],
  "certifications": [""],
  "languages": [""]
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        text_out = response.choices[0].message.content.strip()
        if text_out.startswith("```"):
            text_out = text_out.split("```")[1]
            if text_out.startswith("json"):
                text_out = text_out[4:]
        data = json.loads(text_out.strip())
        return data
    except Exception:
        return {"skills": [], "experience_years": 0, "summary": "", "parsed_data": {}}


async def score_resume_against_job(resume_text: str, job_title: str, job_requirements: str) -> dict:
    """Score resume match against a job posting."""
    if not client:
        return {"score": 0, "summary": "AI unavailable", "strengths": [], "gaps": [], "recommendation": "pass"}

    prompt = f"""Score this resume against the job requirements. Be objective and precise.

JOB: {job_title}
REQUIREMENTS: {job_requirements[:1500]}

RESUME:
{resume_text[:2500]}

Return ONLY valid JSON:
{{
  "score": <0-100 float>,
  "summary": "<concise 2 sentence assessment>",
  "strengths": ["<top strength>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "matched_skills": ["<skill>"],
  "missing_skills": ["<skill>"],
  "recommendation": "<hire|maybe|pass>"
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        text_out = response.choices[0].message.content.strip()
        if text_out.startswith("```"):
            text_out = text_out.split("```")[1]
            if text_out.startswith("json"):
                text_out = text_out[4:]
        return json.loads(text_out.strip())
    except Exception:
        return {"score": 0, "summary": "AI unavailable", "strengths": [], "gaps": [], "recommendation": "pass"}
