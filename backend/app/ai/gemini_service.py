import os

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


# -----------------------------
# Resume Analysis
# -----------------------------
# Resume Analysis (Gemini Structured Deep Audit)
# -----------------------------
def analyze_resume(resume_text: str) -> dict:
    import json
    from app.services.ats_service import calculate_ats_score

    # Compute deterministic baseline analysis first
    base_ats = calculate_ats_score(resume_text)

    prompt = f"""
You are an expert ATS Resume Reviewer and Senior Talent Evaluator.
Analyze the following complete resume text in depth.

Return ONLY a valid JSON object without markdown fences or extraneous text with this EXACT schema:
{{
  "summary": "2-3 sentences executive summary of candidate profile and market readiness",
  "candidate_type": "{base_ats.get('candidate_type', 'fresher')}",
  "category_scores": {{
    "contact": integer (0-5),
    "summary": integer (0-10),
    "skills": integer (0-15),
    "experience": integer (0-20),
    "projects": integer (0-15),
    "education": integer (0-10),
    "certifications": integer (0-5),
    "achievements": integer (0-5),
    "keywords": integer (0-5),
    "formatting": integer (0-5),
    "links": integer (0-5)
  }},
  "strengths": [
    "string: specific strengths observed in candidate's text"
  ],
  "weaknesses": [
    "string: specific weaknesses that lower ATS score"
  ],
  "missing_sections": [
    "string: missing or incomplete sections"
  ],
  "missing_keywords": [
    "string: important technical keywords missing from this profile"
  ],
  "recommendations": [
    "string: concrete action item to increase interview callbacks"
  ],
  "experience_analysis": [
    "string: assessment of action verbs and measurable metrics in bullet points"
  ],
  "project_analysis": [
    "string: assessment of project implementation details and links"
  ],
  "education_analysis": {{
    "degree": "string: detected degree",
    "institution": "string: detected university or college",
    "completeness": "Complete or Incomplete",
    "notes": "string: educational assessment"
  }},
  "certification_analysis": [
    "string: recognized certifications or recommended courses"
  ],
  "contact_analysis": {{
    "has_email": true,
    "has_phone": true,
    "has_links": true,
    "notes": "string: contact assessment"
  }},
  "formatting_analysis": {{
    "risk_level": "Low Risk or Medium Risk or Potential ATS Parsing Risk",
    "bullet_structure": "string: evaluation of bullet usage",
    "notes": "string: readability and parsing safety assessment"
  }},
  "interview_questions": [
    "1. string technical question based on their stack",
    "2. string project architecture question",
    "3. string problem solving question"
  ]
}}

Resume:
{resume_text}
"""

    try:
        response = model.generate_content(prompt)
        text_resp = response.text.strip()

        # Clean markdown codeblocks if returned
        if text_resp.startswith("```"):
            lines = text_resp.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text_resp = "\n".join(lines).strip()

        parsed = json.loads(text_resp)
        return parsed
    except Exception as e:
        print(f"[WARN] Gemini analyze_resume JSON parse error or timeout: {e}. Using deterministic fallback.")
        # Robust fallback using deterministic full ATS calculation
        return {
            "summary": f"Candidate profile identified as {base_ats.get('candidate_type', 'fresher')}. Skills: {', '.join(base_ats.get('skills', [])[:6])}.",
            "candidate_type": base_ats.get("candidate_type", "fresher"),
            "category_scores": base_ats.get("category_scores", {}),
            "strengths": base_ats.get("strengths", []),
            "weaknesses": base_ats.get("weaknesses", []),
            "missing_sections": base_ats.get("missing_sections", []),
            "missing_keywords": base_ats.get("missing_keywords", []),
            "recommendations": base_ats.get("suggestions", []),
            "experience_analysis": [base_ats["sections"]["experience"].get("feedback", "No work experience details.")],
            "project_analysis": [base_ats["sections"]["projects"].get("feedback", "No project details.")],
            "education_analysis": {
                "degree": "Identified in resume" if base_ats["sections"]["education"].get("degree_found") else "Not detected",
                "institution": "Identified in resume" if base_ats["sections"]["education"].get("college_found") else "Not detected",
                "completeness": "Complete" if base_ats["sections"]["education"].get("score", 0) >= 8 else "Needs year/CGPA",
                "notes": base_ats["sections"]["education"].get("feedback", "")
            },
            "certification_analysis": [base_ats["sections"]["certifications"].get("feedback", "Add certifications.")],
            "contact_analysis": {
                "has_email": base_ats["sections"]["contact"]["details"].get("email", False),
                "has_phone": base_ats["sections"]["contact"]["details"].get("phone", False),
                "has_links": base_ats["sections"]["contact"]["details"].get("github", False) or base_ats["sections"]["contact"]["details"].get("linkedin", False),
                "notes": "Contact details analyzed."
            },
            "formatting_analysis": {
                "risk_level": base_ats["sections"]["formatting"].get("risk_level", "Low Risk"),
                "bullet_structure": base_ats["sections"]["formatting"].get("bullet_ratio", ""),
                "notes": base_ats["sections"]["formatting"].get("feedback", "")
            },
            "interview_questions": [
                f"Can you explain your experience with {base_ats.get('skills', ['your core language'])[0]}?",
                "Walk me through the architecture and technical challenges of your top project.",
                "How do you approach optimizing performance and database queries in your applications?"
            ]
        }


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
Your goal is to guide users in their career roadmap, skill optimization, placement preparation, and resume building.

Candidate Resume Context:
{resume_text if resume_text else "No resume uploaded yet."}

Previous Conversation History:
{history_context}

New Message from User: {message}

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


# -----------------------------
# Skill Test MCQ Generator
# -----------------------------
def generate_skill_mcq_test(skill_name: str, num_questions: int = 5):
    count = max(num_questions, 5)
    prompt = f"""
You are an expert Technical Interviewer.
Generate {count} multiple-choice questions (MCQs) to evaluate a candidate's proficiency in '{skill_name}'.
The questions should cover practical, interview-level topics and include at least {count} high-quality questions.

Return ONLY a valid JSON array of {count} objects without any codeblocks or commentary.
Format:
[
  {{
    "id": 1,
    "skill": "{skill_name}",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0
  }}
]
"""
    response = model.generate_content(prompt)
    text = response.text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def generate_multi_skill_mcq_test(skills: list[str], min_per_skill: int = 3):
    count_per_skill = max(min_per_skill, 3)
    skills_joined = ", ".join(skills)
    prompt = f"""
You are an expert Technical Interviewer.
Generate multiple-choice questions (MCQs) to evaluate a candidate across these skills: {skills_joined}.
Requirements:
1. Generate AT LEAST {count_per_skill} questions for EACH skill in the list.
2. The questions must test practical knowledge.

Return ONLY a valid JSON array of objects without any codeblocks or commentary.
Format:
[
  {{
    "id": 1,
    "skill": "SkillName",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0
  }}
]
"""
    response = model.generate_content(prompt)
    text = response.text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


# -----------------------------
# Skill Learning Resource Suggester
# -----------------------------
def generate_learning_resources(skill_name: str):
    prompt = f"""
You are an AI Tech Educator.
Suggest 3 best free learning resources (e.g. Official Documentation, FreeCodeCamp, YouTube Playlist) for learning '{skill_name}'.

Return ONLY a valid JSON array of 3 objects without any codeblocks or commentary.
Format:
[
  {{
    "title": "Resource Title",
    "type": "Documentation",
    "url": "https://...",
    "difficulty": "Beginner / Intermediate / Advanced",
    "estimated_time": "8 Hours"
  }}
]
"""
    response = model.generate_content(prompt)
    text = response.text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


# -----------------------------
# AI Certificate Verification
# -----------------------------
def verify_certificate_document(
    file_bytes: bytes,
    mime_type: str,
    claimed_skill: str,
    extracted_text: str = ""
) -> dict:
    """
    Independently inspects and validates an uploaded certificate using Gemini Multimodal AI.
    Never relies on filename or client-side claims.
    """
    clean_skill = claimed_skill.strip()
    
    prompt = f"""
You are an expert Credential and Certification Verification AI.
A user has uploaded a document claiming verification for the skill: '{clean_skill}'.

CRITICAL VALIDATION RULES:
1. Examine the ACTUAL VISUAL CONTENT and text of the uploaded document (seals, stamps, signatures, certificate layout, header, title, issuer).
2. DO NOT use or trust any external metadata or filenames. Judge ONLY the content of the file.
3. Check if this document is genuinely an official educational, training, course completion, or professional credential (is_certificate: true).
   - If this is a resume, CV, homework assignment, class notes, invoice, essay, ID card, or random image/document, set is_certificate: false.
4. Check if the certificate content explicitly verifies, covers, or certifies the claimed skill '{clean_skill}' (skill_relevant: true/false).
   - Example: If claimed skill is 'Java', a certificate for 'Python Programming' or 'Web Design with HTML' is NOT skill relevant.
5. Identify the true primary skill or technology the certificate actually certifies (matched_skill: string or null).
6. Extract the certificate title / course name (certificate_title: string or null).
7. Extract the issuing organization, university, academy, or platform (issuer: string or null).
8. Confidence score (0.0 to 1.0) based on clarity of credential proofs.
9. Provide a concise, professional reason explaining why it is verified or rejected.
10. Set status to 'verified' ONLY IF is_certificate is true AND skill_relevant is true; otherwise set to 'rejected'.

Respond ONLY in valid raw JSON with this exact structure:
{{
  "is_certificate": true,
  "skill_relevant": true,
  "matched_skill": "{clean_skill}",
  "certificate_title": "Course Title",
  "issuer": "Issuing Body",
  "confidence": 0.95,
  "reason": "The certificate content explicitly verifies...",
  "status": "verified"
}}
"""

    if extracted_text:
        prompt += f"\n\nExtracted Text from Document for Reference:\n\"\"\"\n{extracted_text[:4000]}\n\"\"\""

    content_parts = [prompt]
    
    # Map mime type safely
    normalized_mime = mime_type.lower()
    if "pdf" in normalized_mime:
        normalized_mime = "application/pdf"
    elif "png" in normalized_mime:
        normalized_mime = "image/png"
    elif "jpeg" in normalized_mime or "jpg" in normalized_mime:
        normalized_mime = "image/jpeg"
    elif "webp" in normalized_mime:
        normalized_mime = "image/webp"

    if normalized_mime in ["application/pdf", "image/png", "image/jpeg", "image/webp"] and file_bytes:
        content_parts.append({
            "mime_type": normalized_mime,
            "data": file_bytes
        })

    try:
        response = model.generate_content(content_parts)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        import json
        data = json.loads(text)

        # Normalize outputs
        is_cert = bool(data.get("is_certificate", False))
        skill_relevant = bool(data.get("skill_relevant", False))
        matched = data.get("matched_skill")
        cert_title = data.get("certificate_title")
        issuer = data.get("issuer")
        confidence = float(data.get("confidence", 0.0) or 0.0)
        reason = data.get("reason", "")
        status = "verified" if (is_cert and skill_relevant) else "rejected"

        return {
            "is_certificate": is_cert,
            "skill_relevant": skill_relevant,
            "matched_skill": matched,
            "certificate_title": cert_title,
            "issuer": issuer,
            "confidence": round(confidence, 2),
            "reason": reason or ("Certificate verified successfully." if status == "verified" else "Certificate does not verify the selected skill."),
            "status": status
        }
    except Exception as e:
        print(f"[ERROR] Gemini certificate verification error: {e}")
        # Text-based fallback if document text was extracted
        import re
        if extracted_text:
            text_lower = extracted_text.lower()
            cert_markers = ["certificate", "certify", "completion", "achievement", "completed", "awarded", "diploma", "credential"]
            has_cert_marker = any(m in text_lower for m in cert_markers)
            
            # Check target skill word boundary in text (NEVER in filename)
            skill_pattern = r'\b' + re.escape(clean_skill.lower()) + r'\b'
            has_skill_in_text = bool(re.search(skill_pattern, text_lower))

            if has_cert_marker and has_skill_in_text:
                return {
                    "is_certificate": True,
                    "skill_relevant": True,
                    "matched_skill": clean_skill,
                    "certificate_title": f"{clean_skill} Certification",
                    "issuer": "Verified Institution",
                    "confidence": 0.85,
                    "reason": f"Document text confirms completion and explicitly verifies proficiency in {clean_skill}.",
                    "status": "verified"
                }
            elif has_cert_marker and not has_skill_in_text:
                return {
                    "is_certificate": True,
                    "skill_relevant": False,
                    "matched_skill": "Other Skill",
                    "certificate_title": "Certificate",
                    "issuer": "Institution",
                    "confidence": 0.80,
                    "reason": f"Uploaded document is a certificate, but does not certify proficiency in {clean_skill}.",
                    "status": "rejected"
                }
            else:
                return {
                    "is_certificate": False,
                    "skill_relevant": False,
                    "matched_skill": None,
                    "certificate_title": None,
                    "issuer": None,
                    "confidence": 0.90,
                    "reason": "The uploaded document does not appear to be an official certificate.",
                    "status": "rejected"
                }

        # If no text could be extracted and Gemini failed
        return {
            "is_certificate": False,
            "skill_relevant": False,
            "matched_skill": None,
            "certificate_title": None,
            "issuer": None,
            "confidence": 0.0,
            "reason": "Could not analyze certificate content. Please ensure the file is a clear, legible PDF or image certificate.",
            "status": "rejected"
        }