import pdfplumber
import docx


# -------------------------
# PDF TEXT EXTRACTION
# -------------------------
def extract_text_from_pdf(file_path: str) -> str:
    text = ""

    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"[WARNING] pdfplumber parsing failed: {e}")
        try:
            import pypdf
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
        except Exception as e2:
            print(f"[WARNING] pypdf parsing also failed: {e2}")

    return text.strip()


# -------------------------
# DOCX TEXT EXTRACTION
# -------------------------
def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs if para.text])
        return text.strip()
    except Exception as e:
        print(f"[WARNING] DOCX parsing failed: {e}")
        return ""


# -------------------------
# MAIN FUNCTION (AUTO DETECT)
# -------------------------
def extract_resume_text(file_path: str) -> str:
    try:
        lower_path = file_path.lower()
        if lower_path.endswith(".pdf"):
            return extract_text_from_pdf(file_path)
        elif lower_path.endswith(".docx") or lower_path.endswith(".doc"):
            return extract_text_from_docx(file_path)
        else:
            # Fallback: try PDF first then DOCX
            res = extract_text_from_pdf(file_path)
            if not res:
                res = extract_text_from_docx(file_path)
            return res
    except Exception as e:
        print(f"[WARNING] extract_resume_text unexpected error: {e}")
        return ""


# -------------------------
# RESUME VALIDATION CHECK
# -------------------------
import re

def validate_resume_document(text: str, filename: str = "") -> tuple[bool, str]:
    """
    Validates whether the extracted text and filename represent a genuine Resume/CV.
    Returns (is_valid: bool, error_reason: str).
    """
    if not text or len(text.strip()) < 40:
        return False, "Uploaded document contains no readable text or is empty. Please upload a valid PDF or DOCX Resume/CV."

    text_lower = text.lower()
    filename_lower = filename.lower()

    # 1. Non-resume filename pattern checks
    non_resume_filename_patterns = [
        r"\bpractical\b", r"\bpr[-_]?\d+", r"\bassignment\b", r"\blab[-_]?manual\b",
        r"\bexperiment\b", r"\binvoice\b", r"\breceipt\b", r"\bmarksheet\b",
        r"\bsyllabus\b", r"\bquestion[-_]?paper\b", r"\btutorial\b", r"\bchapter[-_]?\d+\b"
    ]
    filename_is_non_resume = any(re.search(pat, filename_lower) for pat in non_resume_filename_patterns)

    # 2. Check explicit resume keywords (highest confidence)
    explicit_resume_keywords = ["curriculum vitae", "resume", "biodata", "c.v."]
    has_explicit_title = any(re.search(r"\b" + re.escape(kw) + r"\b", text_lower) for kw in explicit_resume_keywords)

    # 3. Check for standard resume sections
    resume_section_patterns = {
        "education": r"\b(education|academic[s]?|qualifications?|academic background)\b",
        "experience": r"\b(experience|work experience|employment|work history|professional experience|internship[s]?)\b",
        "skills": r"\b(skills?|technical skills|core competencies|skills & abilities|key skills|technologies)\b",
        "projects": r"\b(projects?|key projects|academic projects|personal projects)\b",
        "summary": r"\b(summary|profile|career objective|professional summary|about me|objective)\b",
        "contact": r"\b(contact|email|phone|mobile|address|linkedin|github)\b",
        "certifications": r"\b(certifications?|certificates?|achievements?|accomplishments?)\b",
        "personal": r"\b(personal details|declaration|languages known|hobbies)\b"
    }

    # 4. Check contact signals
    has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text_lower))
    has_phone = bool(re.search(r"\+?\d[\d\s\-\(\)]{8,}\d", text))

    positive_sections_found = set()
    for section_name, pattern in resume_section_patterns.items():
        if re.search(pattern, text_lower):
            positive_sections_found.add(section_name)

    # 5. Check strong non-resume / academic / invoice / certificate patterns
    negative_content_patterns = [
        r"\bpractical\s*[\:\-]?\s*\d*",
        r"\bexperiment\s*[\:\-]?\s*\d*",
        r"\baim\s*[\:\-]",
        r"\bapparatus\s*[\:\-]",
        r"\bprocedure\s*[\:\-]",
        r"\boutput\s*[\:\-]",
        r"\benrollment\s*(no|num|number)?\b",
        r"\bguided\s*by\s*[\:\-]",
        r"\bsubmitted\s*by\s*[\:\-]",
        r"\bsubmitted\s*to\s*[\:\-]",
        r"\blaboratory\s*(manual|report)?\b",
        r"\btable\s*of\s*contents\b",
        r"\bsubject\s*code\b",
        r"\bcourse\s*code\b",
        r"\bexercise\s*\d+",
        r"\bquestion\s*\d+",
        r"\bans\s*[\:\-]",
        r"\btax\s*invoice\b",
        r"\bbill\s*to\b",
        r"\bship\s*to\b",
        r"\bmark\s*sheet\b",
        r"\bcertificate\s*of\s*(completion|achievement|appreciation|participation)\b"
    ]

    negative_matches = [pat for pat in negative_content_patterns if re.search(pat, text_lower)]
    negative_score = len(negative_matches)

    # Calculate overall resume positivity score
    positive_score = len(positive_sections_found)
    if has_email:
        positive_score += 1
    if has_phone:
        positive_score += 1
    if has_explicit_title:
        positive_score += 2

    # --- Validation Rules ---
    # Case A: Filename clearly indicates a non-resume (e.g. WT PR-9-063, Practical_1, Assignment)
    if filename_is_non_resume and not (has_explicit_title and positive_score >= 4):
        return False, "Invalid Document: Filename indicates a practical manual, assignment, or non-resume document."

    # Case B: Document text contains practical / lab / report structures
    if negative_score >= 2 and positive_score < 4:
        return False, "Invalid Document: Uploaded file appears to be an academic practical, assignment, or general report rather than a Resume/CV."

    if negative_score >= 1 and positive_score < 3:
        return False, "Invalid Document: Uploaded file contains practical/lab assignment structures and lacks standard Resume/CV sections."

    # Case C: Document lacks standard resume sections & contact details
    if positive_score < 2:
        return False, "Invalid Document: Document does not contain standard Resume/CV sections (e.g., Education, Experience, Skills, Projects, or Contact details)."

    return True, ""