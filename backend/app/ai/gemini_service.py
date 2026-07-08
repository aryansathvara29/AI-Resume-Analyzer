import os

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


# -----------------------------
# Resume Analysis
# -----------------------------
def analyze_resume(resume_text: str):

    prompt = f"""
You are an expert ATS Resume Reviewer.

Analyze the following resume.

Return your response in this format.

Resume Summary:
...

Strengths:
- ...

Weaknesses:
- ...

Missing Skills:
- ...

Suggestions:
- ...

Interview Questions:
1.
2.
3.

Resume:

{resume_text}
"""

    response = model.generate_content(prompt)

    return response.text


# -----------------------------
# Resume vs Job Description Match
# -----------------------------
def match_resume_job(resume_text: str, job_description: str):

    prompt = f"""
You are an ATS Resume Expert.

Compare the following Resume with the Job Description.

Resume:
{resume_text}

Job Description:
{job_description}

Return ONLY in this format:

ATS Match Score (0-100)

Matching Skills

Missing Skills

Strengths

Weaknesses

Resume Improvement Suggestions

Final Recommendation
"""

    response = model.generate_content(prompt)

    return response.text