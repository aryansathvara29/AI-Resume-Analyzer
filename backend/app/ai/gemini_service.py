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


# -----------------------------
# Career Advisor Chatbot
# -----------------------------
def generate_career_advisor_response(chat_history: list, message: str, resume_text: str = ""):
    # Format chat history for prompt context
    history_context = ""
    for chat in chat_history:
        role = "User" if chat.get("sender") == "user" else "Advisor"
        history_context += f"{role}: {chat.get('text')}\n"

    prompt = f"""
You are an expert AI Career Coach and Recruitment Advisor.
Your goal is to guide students in their career roadmap, skill optimization, placement preparation, and resume building.

Candidate Resume Context:
{resume_text if resume_text else "No resume uploaded yet."}

Previous Conversation History:
{history_context}

New Message from Student: {message}

Provide a direct, conversational, and highly helpful response. Keep it concise, professional, and actionable. Do NOT repeat previous messages.
"""
    response = model.generate_content(prompt)
    return response.text


# -----------------------------
# AI Mock Interview Coach
# -----------------------------
def evaluate_interview_answer(question: str, answer: str, resume_text: str = ""):
    prompt = f"""
You are an expert Technical Interviewer.
Evaluate the candidate's response to the given interview question.

Candidate Resume Context:
{resume_text if resume_text else "No resume context."}

Question Asked:
{question}

Candidate's Answer:
{answer}

Evaluate the response and provide details in this structured format:

Rating (Out of 10):
[e.g., 7/10]

Key Strengths of the Answer:
- ...

Areas of Improvement:
- ...

Model Answer Recommendation:
...
"""
    response = model.generate_content(prompt)
    return response.text


# -----------------------------
# AI Career Roadmap Generator
# -----------------------------
def generate_career_roadmap(resume_text: str):
    prompt = f"""
You are an AI Career Planning Expert.
Analyze the following resume and map out a tailored, step-by-step career development roadmap.

Candidate Resume:
{resume_text}

Provide your feedback in this format:

Recommended Career Path:
[e.g., Senior Full Stack Java Developer]

Step 1: Core Skill Upgrades (What to learn next):
- ...

Step 2: Certificates & Accreditations (Recommended exams):
- ...

Step 3: Industry Projects to Build (Practical application):
- ...

Step 4: Target Companies & Job Roles:
- ...
"""
    response = model.generate_content(prompt)
    return response.text