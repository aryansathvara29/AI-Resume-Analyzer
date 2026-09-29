import re
from typing import Any


# -------------------------
# MASTER SKILL DEFINITIONS & PATTERNS
# -------------------------
SKILL_DEFINITIONS = [
    # Programming Languages
    {"canonical": "c", "category": "Programming Languages", "patterns": [r"\bc\b"]},
    {"canonical": "c++", "category": "Programming Languages", "patterns": [r"\bc\+\+\b", r"\bcpp\b"]},
    {"canonical": "c#", "category": "Programming Languages", "patterns": [r"\bc\#\b", r"\bcsharp\b"]},
    {"canonical": "java", "category": "Programming Languages", "patterns": [r"\bjava\b(?!script)"]},
    {"canonical": "python", "category": "Programming Languages", "patterns": [r"\bpython\b"]},
    {"canonical": "javascript", "category": "Programming Languages", "patterns": [r"\bjavascript\b", r"\bjs\b"]},
    {"canonical": "typescript", "category": "Programming Languages", "patterns": [r"\btypescript\b", r"\bts\b"]},
    {"canonical": "php", "category": "Programming Languages", "patterns": [r"\bphp\b"]},
    {"canonical": "go", "category": "Programming Languages", "patterns": [r"\bgo\b", r"\bgolang\b"]},
    {"canonical": "kotlin", "category": "Programming Languages", "patterns": [r"\bkotlin\b"]},
    {"canonical": "swift", "category": "Programming Languages", "patterns": [r"\bswift\b"]},
    {"canonical": "rust", "category": "Programming Languages", "patterns": [r"\brust\b"]},
    {"canonical": "ruby", "category": "Programming Languages", "patterns": [r"\bruby\b"]},

    # Web Technologies & Frontend
    {"canonical": "html", "category": "Web Technologies", "patterns": [r"\bhtml(?:5)?\b"]},
    {"canonical": "css", "category": "Web Technologies", "patterns": [r"\bcss(?:3)?\b"]},
    {"canonical": "react", "category": "Web Technologies", "patterns": [r"\breact(?:\.js)?\b", r"\breactjs\b"]},
    {"canonical": "next.js", "category": "Web Technologies", "patterns": [r"\bnext(?:\.js)?\b", r"\bnextjs\b"]},
    {"canonical": "vue", "category": "Web Technologies", "patterns": [r"\bvue(?:\.js)?\b", r"\bvuejs\b"]},
    {"canonical": "angular", "category": "Web Technologies", "patterns": [r"\bangular(?:\.js)?\b", r"\bangularjs\b"]},
    {"canonical": "tailwind", "category": "Web Technologies", "patterns": [r"\btailwind(?:\s*css)?\b"]},
    {"canonical": "bootstrap", "category": "Web Technologies", "patterns": [r"\bbootstrap(?:5)?\b"]},

    # Backend & Frameworks
    {"canonical": "fastapi", "category": "Backend", "patterns": [r"\bfastapi\b"]},
    {"canonical": "django", "category": "Backend", "patterns": [r"\bdjango\b"]},
    {"canonical": "flask", "category": "Backend", "patterns": [r"\bflask\b"]},
    {"canonical": "spring", "category": "Backend", "patterns": [r"\bspring\b(?!boot)"]},
    {"canonical": "spring boot", "category": "Backend", "patterns": [r"\bspring\s*boot\b"]},
    {"canonical": "node.js", "category": "Backend", "patterns": [r"\bnode(?:\.js)?\b", r"\bnodejs\b"]},
    {"canonical": "express", "category": "Backend", "patterns": [r"\bexpress(?:\.js)?\b"]},
    {"canonical": "graphql", "category": "Backend", "patterns": [r"\bgraphql\b"]},

    # Databases
    {"canonical": "mysql", "category": "Databases", "patterns": [r"\bmysql\b"]},
    {"canonical": "postgresql", "category": "Databases", "patterns": [r"\bpostgres(?:ql)?\b"]},
    {"canonical": "mongodb", "category": "Databases", "patterns": [r"\bmongodb\b", r"\bmongo\b"]},
    {"canonical": "sqlite", "category": "Databases", "patterns": [r"\bsqlite(?:3)?\b"]},
    {"canonical": "oracle", "category": "Databases", "patterns": [r"\boracle\b"]},
    {"canonical": "sql", "category": "Databases", "patterns": [r"\bsql\b"]},
    {"canonical": "redis", "category": "Databases", "patterns": [r"\bredis\b"]},

    # Data Science & Analytics
    {"canonical": "numpy", "category": "Data Science", "patterns": [r"\bnumpy\b"]},
    {"canonical": "pandas", "category": "Data Science", "patterns": [r"\bpandas\b"]},
    {"canonical": "matplotlib", "category": "Data Science", "patterns": [r"\bmatplotlib\b"]},
    {"canonical": "seaborn", "category": "Data Science", "patterns": [r"\bseaborn\b"]},
    {"canonical": "scikit-learn", "category": "Data Science", "patterns": [r"\bscikit[- ]learn\b", r"\bsklearn\b"]},

    # AI & Machine Learning
    {"canonical": "machine learning", "category": "AI/ML", "patterns": [r"\bmachine\s+learning\b", r"\bml\b"]},
    {"canonical": "deep learning", "category": "AI/ML", "patterns": [r"\bdeep\s+learning\b"]},
    {"canonical": "tensorflow", "category": "AI/ML", "patterns": [r"\btensorflow\b"]},
    {"canonical": "pytorch", "category": "AI/ML", "patterns": [r"\bpytorch\b"]},
    {"canonical": "opencv", "category": "AI/ML", "patterns": [r"\bopencv\b"]},
    {"canonical": "nlp", "category": "AI/ML", "patterns": [r"\bnlp\b", r"\bnatural\s+language\s+processing\b"]},
    {"canonical": "openai", "category": "AI/ML", "patterns": [r"\bopenai\b"]},
    {"canonical": "gemini", "category": "AI/ML", "patterns": [r"\bgemini(?:\s*ai)?\b"]},

    # Tools, DevOps & Cloud
    {"canonical": "git", "category": "DevOps & Tools", "patterns": [r"\bgit\b(?!hub)"]},
    {"canonical": "github", "category": "DevOps & Tools", "patterns": [r"\bgithub\b"]},
    {"canonical": "docker", "category": "DevOps & Tools", "patterns": [r"\bdocker\b"]},
    {"canonical": "kubernetes", "category": "DevOps & Tools", "patterns": [r"\bkubernetes\b", r"\bk8s\b"]},
    {"canonical": "aws", "category": "Cloud", "patterns": [r"\baws\b", r"\bamazon\s+web\s+services\b"]},
    {"canonical": "azure", "category": "Cloud", "patterns": [r"\bazure\b"]},
    {"canonical": "linux", "category": "DevOps & Tools", "patterns": [r"\blinux\b"]},
    {"canonical": "rest api", "category": "Backend", "patterns": [r"\brest(?:ful)?\s*api[s]?\b"]},
    {"canonical": "jwt", "category": "Backend", "patterns": [r"\bjwt\b"]},
]

SKILLS = [item["canonical"] for item in SKILL_DEFINITIONS]

# Action verbs commonly looked for by ATS scanners & recruiters
ACTION_VERBS = [
    "accelerated", "accomplished", "achieved", "acquired", "adapted", "administered",
    "analyzed", "architected", "automated", "built", "championed", "collaborated",
    "configured", "constructed", "created", "customized", "debugged", "delivered",
    "deployed", "designed", "developed", "devised", "engineered", "enhanced",
    "established", "executed", "expanded", "expedited", "fabricated", "formulated",
    "generated", "guided", "implemented", "improved", "increased", "initiated",
    "innovated", "integrated", "launched", "lead", "led", "managed", "maximized",
    "mentored", "migrated", "minimized", "modeled", "monitored", "modernized",
    "optimized", "orchestrated", "organized", "overhauled", "pioneered", "planned",
    "produced", "programmed", "reduced", "refactored", "resolved", "restructured",
    "revamped", "scaled", "simplified", "solved", "spearheaded", "standardized",
    "streamlined", "strengthened", "supervised", "tested", "tracked", "trained",
    "transformed", "troubleshot", "unified", "upgraded", "validated", "yielded"
]

# Section Headers Dictionary
SECTION_PATTERNS = {
    "summary": [
        r"professional\s+summary", r"career\s+summary", r"summary\s+of\s+qualifications",
        r"executive\s+summary", r"career\s+objective", r"objective", r"profile", r"about\s+me"
    ],
    "skills": [
        r"technical\s+skills?", r"key\s+skills?", r"core\s+competencies", r"core\s+skills?",
        r"skills?\s*(?:&|and)\s*abilities", r"skills?\s*(?:&|and)\s*proficiencies",
        r"skills?\s*(?:&|and)\s*expertise", r"areas\s+of\s+expertise", r"programming\s+skills?",
        r"it\s+skills?", r"computer\s+skills?", r"technologies", r"skills?"
    ],
    "experience": [
        r"work\s+experience", r"professional\s+experience", r"employment\s+history",
        r"additional\s+experience", r"relevant\s+experience", r"career\s+history",
        r"work\s+history", r"experience"
    ],
    "internships": [
        r"internships?", r"industrial\s+training", r"practical\s+training", r"apprentice(?:ship)?"
    ],
    "projects": [
        r"academic\s+projects?", r"personal\s+projects?", r"key\s+projects?",
        r"featured\s+projects?", r"technical\s+projects?", r"projects?"
    ],
    "education": [
        r"academic\s+background", r"academics?", r"educational\s+qualifications?",
        r"qualifications?", r"education"
    ],
    "certifications": [
        r"certifications?", r"certificates?", r"licenses?\s*(?:&|and)\s*certifications?",
        r"professional\s+certifications?", r"courses?\s*(?:&|and)\s*certifications?"
    ],
    "achievements": [
        r"achievements?", r"accomplishments?", r"awards?\s*(?:&|and)\s*honors?",
        r"honors?\s*(?:&|and)\s*awards?", r"awards?", r"honors?", r"extracurricular\s+achievements?"
    ],
    "publications": [
        r"publications?", r"research\s+papers?", r"patents?", r"conference\s+proceedings?"
    ],
    "extracurricular": [
        r"extra[- ]curricular\s+activities", r"activities", r"volunteer(?:ing)?\s+experience",
        r"co[- ]curricular\s+activities", r"leadership\s+activities", r"volunteering"
    ],
    "languages": [
        r"languages\s+known", r"languages\s+proficiency", r"languages"
    ]
}


# -------------------------
# SECTION EXTRACTION
# -------------------------
def extract_skills_section_text(full_text: str) -> str:
    """
    Isolates and extracts text inside the dedicated SKILLS section.
    Preserves exact backward compatibility.
    """
    sections = extract_all_sections(full_text)
    return sections.get("skills", "")


def extract_all_sections(full_text: str) -> dict[str, str]:
    """
    Splits the full resume into identified sections based on common headings.
    """
    if not full_text or len(full_text.strip()) < 10:
        return {}

    lines = full_text.splitlines()
    header_indices = []

    # Build flat regex mapping
    for sec_name, patterns in SECTION_PATTERNS.items():
        pattern_str = r"^(?:[\s\*\#\-\•]*)\b(" + "|".join(patterns) + r")\b[\s\:\-\|]*$"
        regex = re.compile(pattern_str, re.IGNORECASE)
        for idx, line in enumerate(lines):
            stripped = line.strip()
            if not stripped:
                continue
            if regex.match(stripped):
                header_indices.append((idx, sec_name, stripped))

    # Sort headers by line position
    header_indices.sort(key=lambda x: x[0])

    # De-duplicate headers appearing on the same line
    unique_headers = []
    seen_lines = set()
    for idx, sec, text in header_indices:
        if idx not in seen_lines:
            unique_headers.append((idx, sec, text))
            seen_lines.add(idx)

    sections = {}
    total_lines = len(lines)

    # Everything before the first header is considered contact/header
    if unique_headers:
        first_idx = unique_headers[0][0]
        sections["header"] = "\n".join(lines[:first_idx]).strip()

        for i in range(len(unique_headers)):
            cur_idx, cur_sec, _ = unique_headers[i]
            next_idx = unique_headers[i + 1][0] if i + 1 < len(unique_headers) else total_lines
            content = "\n".join(lines[cur_idx + 1:next_idx]).strip()
            if cur_sec in sections:
                sections[cur_sec] += "\n" + content
            else:
                sections[cur_sec] = content
    else:
        # Fallback if no clean line-based headers were recognized
        sections["header"] = "\n".join(lines[:8]).strip()
        sections["body"] = full_text

    return sections


# -------------------------
# SKILL DETECTION
# -------------------------
def detect_skills(text: str) -> list[str]:
    """
    Scans strictly within the resume's dedicated SKILLS section.
    If no dedicated section exists, scans whole resume for core technical skills.
    Preserves backward compatibility.
    """
    if not text:
        return []

    sections = extract_all_sections(text)
    skills_text = sections.get("skills", "")
    target_text = skills_text if skills_text else text
    target_lower = target_text.lower()

    found = []
    for item in SKILL_DEFINITIONS:
        for pat in item["patterns"]:
            if re.search(pat, target_lower, re.IGNORECASE):
                found.append(item["canonical"])
                break

    return sorted(list(set(found)))


def detect_skills_across_whole_resume(text: str) -> list[str]:
    """
    Finds all skills mentioned anywhere in the resume (for evidence & context).
    """
    if not text:
        return []
    text_lower = text.lower()
    found = []
    for item in SKILL_DEFINITIONS:
        for pat in item["patterns"]:
            if re.search(pat, text_lower, re.IGNORECASE):
                found.append(item["canonical"])
                break
    return sorted(list(set(found)))


# -------------------------
# CANDIDATE TYPE DETECTION
# -------------------------
def detect_candidate_type(text: str, experience_text: str, education_text: str) -> str:
    """
    Determines if candidate is a fresher or experienced professional.
    Context-aware for students and fresh college graduates.
    """
    text_lower = text.lower()
    exp_lower = experience_text.lower() if experience_text else ""

    # Clear fresher indicators
    fresher_keywords = [
        "fresher", "student", "undergraduate", "pursuing", "b.tech", "b.e.",
        "bca", "mca", "b.sc", "b.com", "expected graduation", "batch of 202",
        "semester", "final year", "entry level", "seeking entry"
    ]
    for kw in fresher_keywords:
        if kw in text_lower:
            # Check if they have 3+ years of professional full-time corporate experience
            years_matches = re.findall(r"(\d+)\+?\s*years?(?:\s+of)?\s+experience", exp_lower)
            if years_matches:
                try:
                    if int(years_matches[0]) >= 3:
                        return "experienced"
                except Exception:
                    pass
            return "fresher"

    # Experience section checks
    if not exp_lower or len(exp_lower.split()) < 30:
        return "fresher"

    # Look for duration markers like (2018 - 2022) or (2020 - Present)
    date_ranges = re.findall(r"(?:19|20)\d{2}\s*[-–to]+\s*(?:(?:19|20)\d{2}|present|current)", exp_lower)
    if len(date_ranges) >= 2:
        return "experienced"

    return "fresher"


# -------------------------
# CONTACT & LINKS EVALUATION
# -------------------------
def evaluate_contact(full_text: str, header_text: str) -> dict[str, Any]:
    combined = (header_text + "\n" + full_text[:1200]).lower()

    # Email
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", full_text[:1500])
    has_email = bool(email_match)
    email_val = email_match.group(0) if email_match else None

    # Phone
    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}", full_text[:1500])
    has_phone = bool(phone_match)
    phone_val = phone_match.group(0) if phone_match else None

    # Name detection (first 1-3 lines usually contains candidate name)
    lines = [ln.strip() for ln in full_text.splitlines() if ln.strip()]
    name_val = None
    has_name = False
    for line in lines[:3]:
        # Filter out email, phone, links, or section headers
        if not re.search(r"[@:/\\#\d]", line) and len(line.split()) in [2, 3, 4] and len(line) < 40:
            name_val = line
            has_name = True
            break
    if not has_name and lines:
        name_val = lines[0][:30]
        has_name = bool(name_val)

    # Location
    location_keywords = [
        "india", "bangalore", "bengaluru", "mumbai", "delhi", "pune", "hyderabad",
        "chennai", "kolkata", "ahmedabad", "gurgaon", "noida", "remote", "usa", "california",
        "texas", "new york", "london", "canada", "united states"
    ]
    has_location = any(re.search(r"\b" + loc + r"\b", combined) for loc in location_keywords)
    if not has_location:
        has_location = bool(re.search(r"\b[A-Z][a-z]+,\s*[A-Z][a-z]+\b", full_text[:1000]))

    # Professional Links
    has_github = bool(re.search(r"github\.com/[a-zA-Z0-9_-]+|\bgithub\b", combined))
    has_linkedin = bool(re.search(r"linkedin\.com/in/[a-zA-Z0-9_-]+|\blinkedin\b", combined))
    has_portfolio = bool(re.search(r"portfolio|\bverce[l]?\.app\b|\bnetlify\.app\b|\bgithub\.io\b|https?://[a-zA-Z0-9.-]+\.(?:dev|me|tech|site|com)", combined))

    # Scoring (out of 5 for Contact, out of 5 for Links)
    contact_score = 0
    if has_name: contact_score += 1.5
    if has_email: contact_score += 1.5
    if has_phone: contact_score += 1.0
    if has_location: contact_score += 1.0
    contact_score = min(5, round(contact_score))

    links_score = 0
    if has_github: links_score += 2.0
    if has_linkedin: links_score += 2.0
    if has_portfolio: links_score += 1.0
    links_score = min(5, round(links_score))

    return {
        "contact_score": contact_score,
        "links_score": links_score,
        "details": {
            "name": has_name,
            "detected_name": name_val,
            "email": has_email,
            "detected_email": email_val,
            "phone": has_phone,
            "detected_phone": phone_val,
            "location": has_location,
            "github": has_github,
            "linkedin": has_linkedin,
            "portfolio": has_portfolio,
        }
    }


# -------------------------
# PROFESSIONAL SUMMARY EVALUATION
# -------------------------
def evaluate_summary(summary_text: str, candidate_type: str) -> dict[str, Any]:
    if not summary_text or len(summary_text.strip()) < 15:
        return {
            "score": 0,
            "present": False,
            "feedback": "Missing Professional Summary or Objective statement.",
            "is_generic": False,
            "word_count": 0
        }

    words = summary_text.split()
    word_count = len(words)
    text_lower = summary_text.lower()

    # Check for generic cliches
    cliches = [
        "hard working and dedicated", "seeking a challenging position",
        "looking for an entry level opportunity", "to utilize my skills for organization growth",
        "honest and punctual", "responsible individual"
    ]
    is_generic = any(c in text_lower for c in cliches)

    # Check for technical alignment
    tech_count = sum(1 for item in SKILL_DEFINITIONS if re.search(item["patterns"][0], text_lower))

    # Score calculation (out of 10)
    score = 4  # Base points for having a summary section
    if 25 <= word_count <= 90:
        score += 3
    elif word_count > 90:
        score += 1  # Slightly too wordy

    if tech_count >= 2:
        score += 2
    if not is_generic:
        score += 1

    feedback = "Well-articulated career summary with targeted keywords."
    if is_generic:
        feedback = "Summary contains generic filler phrases. Customize it with your specific technical stack and quantifiable value."
    elif word_count < 25:
        feedback = "Summary is too brief. Expand with your core focus area and career objectives."

    return {
        "score": min(10, score),
        "present": True,
        "feedback": feedback,
        "is_generic": is_generic,
        "word_count": word_count
    }


# -------------------------
# SKILLS EVALUATION
# -------------------------
def evaluate_skills(sections: dict[str, str], full_text: str, max_score: int = 15) -> dict[str, Any]:
    skills_section = sections.get("skills", "")
    detected_in_section = detect_skills(full_text)
    all_skills_in_resume = detect_skills_across_whole_resume(full_text)

    # Categorize detected skills
    categorized = {}
    for sk in detected_in_section:
        for defn in SKILL_DEFINITIONS:
            if defn["canonical"] == sk:
                cat = defn.get("category", "General")
                categorized.setdefault(cat, []).append(sk)
                break

    has_skills_section = bool(skills_section and len(skills_section.strip()) > 10)
    skill_count = len(detected_in_section)

    # Score out of max_score
    if not has_skills_section and skill_count == 0:
        score = 0
    else:
        # Balanced score: variety + section presence + categorization
        base = min(max_score * 0.6, skill_count * (max_score / 10.0))
        diversity_bonus = min(max_score * 0.3, len(categorized.keys()) * (max_score * 0.08))
        section_bonus = (max_score * 0.1) if has_skills_section else 0
        score = round(base + diversity_bonus + section_bonus)

    score = max(0, min(max_score, score))

    return {
        "score": score,
        "max_score": max_score,
        "has_skills_section": has_skills_section,
        "detected_skills": detected_in_section,
        "all_skills_in_resume": all_skills_in_resume,
        "categories": categorized,
        "count": skill_count
    }


# -------------------------
# EXPERIENCE & INTERNSHIP EVALUATION
# -------------------------
def evaluate_experience(sections: dict[str, str], candidate_type: str, max_score: int = 20) -> dict[str, Any]:
    exp_text = sections.get("experience", "")
    intern_text = sections.get("internships", "")
    combined = (exp_text + "\n" + intern_text).strip()

    if not combined or len(combined.split()) < 15:
        if candidate_type == "fresher":
            # For freshers with no formal corporate experience, assign fair partial marks if projects exist
            return {
                "score": round(max_score * 0.6),
                "max_score": max_score,
                "has_experience": False,
                "bullet_count": 0,
                "action_verb_count": 0,
                "has_metrics": False,
                "feedback": "Fresher profile: Weight rebalanced toward technical projects, education, and credentials."
            }
        else:
            return {
                "score": 0,
                "max_score": max_score,
                "has_experience": False,
                "bullet_count": 0,
                "action_verb_count": 0,
                "has_metrics": False,
                "feedback": "Missing Work Experience section for an experienced candidate profile."
            }

    # Count bullet points
    lines = [ln.strip() for ln in combined.splitlines() if ln.strip()]
    bullets = [ln for ln in lines if ln.startswith(("-", "•", "*", "–", "—")) or len(ln.split()) > 6]
    bullet_count = max(len(bullets), len(lines))

    # Detect action verbs
    combined_lower = combined.lower()
    verbs_found = [v for v in ACTION_VERBS if re.search(r"\b" + v + r"\b", combined_lower)]
    action_verb_count = len(verbs_found)

    # Detect measurable metrics (%, $, numbers, user counts)
    has_metrics = bool(re.search(r"\b\d+%\b|\b\d+k\b|\b\d+x\b|\b\d+\+\b|\b\$\d+|\b₹\d+|\breduced\s+by\s+\d+|\bincreased\s+by\s+\d+", combined_lower))

    # Compute score
    score = 0
    if len(combined.split()) >= 30:
        score += max_score * 0.35  # Base content presence
    if bullet_count >= 3:
        score += max_score * 0.25
    if action_verb_count >= 3:
        score += max_score * 0.20
    if has_metrics:
        score += max_score * 0.20

    score = round(min(max_score, max(2, score)))

    feedback = "Strong experience bullet points with action verbs."
    if not has_metrics:
        feedback = "Experience bullets describe tasks well but lack measurable impact (e.g., % improvement, users served, latency reduced)."

    return {
        "score": score,
        "max_score": max_score,
        "has_experience": True,
        "bullet_count": bullet_count,
        "action_verb_count": action_verb_count,
        "verbs_found": verbs_found[:6],
        "has_metrics": has_metrics,
        "feedback": feedback
    }


# -------------------------
# PROJECTS EVALUATION
# -------------------------
def evaluate_projects(sections: dict[str, str], candidate_type: str, max_score: int = 15) -> dict[str, Any]:
    proj_text = sections.get("projects", "").strip()

    if not proj_text or len(proj_text.split()) < 15:
        return {
            "score": round(max_score * 0.2) if candidate_type == "fresher" else 0,
            "max_score": max_score,
            "has_projects": False,
            "project_count": 0,
            "has_tech_stack": False,
            "has_links": False,
            "feedback": "No dedicated Projects section identified. Adding 2-3 technical projects is essential for high ATS ranking."
        }

    proj_lower = proj_text.lower()
    lines = [ln.strip() for ln in proj_text.splitlines() if ln.strip()]

    # Estimate project count
    project_headers = [ln for ln in lines if len(ln.split()) <= 6 and not ln.startswith(("-", "•", "*"))]
    project_count = max(1, min(len(project_headers), 5))

    # Tech stack mentioned
    tech_count = sum(1 for item in SKILL_DEFINITIONS if re.search(item["patterns"][0], proj_lower))
    has_tech_stack = tech_count >= 2

    # Project links (GitHub, live preview, demo)
    has_links = bool(re.search(r"github\.com|http|https|live\s+demo|deployed|vercel|netlify", proj_lower))

    # Action verbs
    verbs_found = [v for v in ACTION_VERBS if re.search(r"\b" + v + r"\b", proj_lower)]

    # Scoring
    score = max_score * 0.35  # Base project section
    if project_count >= 2:
        score += max_score * 0.25
    if has_tech_stack:
        score += max_score * 0.20
    if has_links:
        score += max_score * 0.10
    if len(verbs_found) >= 2:
        score += max_score * 0.10

    score = round(min(max_score, score))

    feedback = "Technical projects clearly demonstrated with supporting tools."
    if not has_links:
        feedback = "Projects are well described, but adding live deployment or GitHub links will significantly improve recruiter interest."

    return {
        "score": score,
        "max_score": max_score,
        "has_projects": True,
        "project_count": project_count,
        "has_tech_stack": has_tech_stack,
        "has_links": has_links,
        "feedback": feedback
    }


# -------------------------
# EDUCATION EVALUATION
# -------------------------
def evaluate_education(sections: dict[str, str], max_score: int = 10) -> dict[str, Any]:
    edu_text = sections.get("education", "").strip()
    if not edu_text:
        return {
            "score": 0,
            "max_score": max_score,
            "has_education": False,
            "degree_found": False,
            "college_found": False,
            "cgpa_found": False,
            "year_found": False,
            "feedback": "Education section missing. ATS expects degree and institution details."
        }

    edu_lower = edu_text.lower()

    # Degree
    degrees = ["b.tech", "b.e", "btech", "bachelor", "master", "m.tech", "mca", "bca", "b.sc", "m.sc", "diploma", "ph.d", "high school"]
    degree_found = any(re.search(r"\b" + d + r"\b", edu_lower) for d in degrees)

    # College / University
    college_indicators = ["university", "institute", "college", "school", "academy", "campus", "polytechnic"]
    college_found = any(ind in edu_lower for ind in college_indicators)

    # CGPA / Percentage
    cgpa_found = bool(re.search(r"\bcgpa\b|\bgpa\b|\bpercentage\b|\bpercent\b|\b\d+\.\d+\s*(?:/\s*10|/\s*4)?\b|\b\d{2}%\b", edu_lower))

    # Graduation Year
    year_found = bool(re.search(r"\b(?:19|20)\d{2}\b", edu_text))

    score = 0
    if degree_found: score += max_score * 0.35
    if college_found: score += max_score * 0.35
    if year_found: score += max_score * 0.15
    if cgpa_found: score += max_score * 0.15

    score = round(min(max_score, max(2, score)))

    return {
        "score": score,
        "max_score": max_score,
        "has_education": True,
        "degree_found": degree_found,
        "college_found": college_found,
        "cgpa_found": cgpa_found,
        "year_found": year_found,
        "feedback": "Education details are complete and clearly formatted." if score >= max_score * 0.8 else "Add graduation year and CGPA/grade to complete the Education section."
    }


# -------------------------
# CERTIFICATIONS & ACHIEVEMENTS EVALUATION
# -------------------------
def evaluate_certifications_and_achievements(sections: dict[str, str], full_text: str, cert_max: int = 5, achieve_max: int = 5) -> tuple[dict[str, Any], dict[str, Any]]:
    cert_text = sections.get("certifications", "").strip()
    achieve_text = sections.get("achievements", "").strip()
    combined_lower = full_text.lower()

    # Certifications detection
    cert_providers = ["aws", "oracle", "udemy", "coursera", "google", "microsoft", "ibm", "cisco", "hackerrank", "freecodecamp", "nptel", "edx"]
    has_cert_sec = bool(cert_text and len(cert_text.split()) > 5)
    provider_matches = [p for p in cert_providers if p in combined_lower]

    cert_score = 0
    if has_cert_sec: cert_score += cert_max * 0.6
    if provider_matches: cert_score += cert_max * 0.4
    cert_score = round(min(cert_max, cert_score))

    cert_res = {
        "score": cert_score,
        "max_score": cert_max,
        "has_certifications": has_cert_sec or bool(provider_matches),
        "providers_found": provider_matches,
        "feedback": "Certifications validate ongoing self-learning." if cert_score > 0 else "Add certifications from recognized providers (Coursera, AWS, Oracle) to boost credentials."
    }

    # Achievements detection
    achieve_keywords = ["hackathon", "winner", "ranked", "rank", "1st", "2nd", "3rd", "runner up", "competition", "scholarship", "dean's list", "published", "award", "olympiad"]
    has_achieve_sec = bool(achieve_text and len(achieve_text.split()) > 5)
    achieve_matches = [k for k in achieve_keywords if re.search(r"\b" + k + r"\b", combined_lower)]

    achieve_score = 0
    if has_achieve_sec: achieve_score += achieve_max * 0.6
    if achieve_matches: achieve_score += achieve_max * 0.4
    achieve_score = round(min(achieve_max, achieve_score))

    achieve_res = {
        "score": achieve_score,
        "max_score": achieve_max,
        "has_achievements": has_achieve_sec or bool(achieve_matches),
        "highlights": achieve_matches[:4],
        "feedback": "Honors & competitive achievements substantiate practical capability." if achieve_score > 0 else "Mention hackathons, coding contests, or academic awards to showcase distinction."
    }

    return cert_res, achieve_res


# -------------------------
# FORMATTING & KEYWORDS EVALUATION
# -------------------------
def evaluate_formatting_and_keywords(full_text: str, sections: dict[str, str], detected_skills: list[str]) -> tuple[dict[str, Any], dict[str, Any]]:
    # Keywords
    word_count = len(full_text.split())
    has_good_length = 200 <= word_count <= 900
    action_verb_count = sum(1 for v in ACTION_VERBS if re.search(r"\b" + v + r"\b", full_text.lower()))

    # Repetition check
    words_lower = full_text.lower().split()
    stuffed = False
    for sk in detected_skills:
        if words_lower.count(sk) > 12:
            stuffed = True
            break

    kw_score = 3
    if len(detected_skills) >= 6: kw_score += 1
    if action_verb_count >= 8: kw_score += 1
    if stuffed: kw_score = max(1, kw_score - 1)
    kw_score = min(5, kw_score)

    kw_res = {
        "score": kw_score,
        "max_score": 5,
        "action_verb_count": action_verb_count,
        "keyword_stuffed": stuffed,
        "feedback": "Keyword density is optimal and natural." if not stuffed else "Some keywords are repeated excessively. Use synonyms to avoid ATS stuffing penalties."
    }

    # Formatting & ATS Compatibility
    lines = [ln.strip() for ln in full_text.splitlines() if ln.strip()]
    bullet_lines = sum(1 for ln in lines if ln.startswith(("-", "•", "*", "–", "—")))
    long_paragraphs = sum(1 for ln in lines if len(ln.split()) > 45)

    risk_level = "Low Risk"
    if long_paragraphs >= 3 or bullet_lines < 3:
        risk_level = "Medium Risk"
    if not sections.get("skills") and not sections.get("education"):
        risk_level = "Potential ATS Parsing Risk"

    fmt_score = 5
    if risk_level == "Medium Risk": fmt_score = 3
    elif risk_level == "Potential ATS Parsing Risk": fmt_score = 2

    fmt_res = {
        "score": fmt_score,
        "max_score": 5,
        "risk_level": risk_level,
        "bullet_ratio": f"{bullet_lines}/{len(lines)} lines",
        "long_paragraphs": long_paragraphs,
        "feedback": f"Document formatting is {risk_level}. Clear bullet points ensure seamless text parsing by corporate applicant trackers."
    }

    return kw_res, fmt_res


# -------------------------
# MASTER FULL-RESUME ATS SCORING
# -------------------------
def calculate_ats_score(text: str) -> dict[str, Any]:
    """
    Comprehensive full-resume ATS scoring algorithm.
    Analyzes entire document: Contact, Summary, Skills, Experience, Projects,
    Education, Certifications, Achievements, Keywords, Links, Formatting.
    Dynamically rebalances weights for fresher profiles.
    Preserves exact backward compatibility with ats_score, skills, suggestions.
    """
    if not text or len(text.strip()) < 20:
        return {
            "ats_score": 0,
            "candidate_type": "fresher",
            "category_scores": {
                "contact": 0, "summary": 0, "skills": 0, "experience": 0,
                "projects": 0, "education": 0, "certifications": 0,
                "achievements": 0, "keywords": 0, "formatting": 0, "links": 0
            },
            "category_max_scores": {
                "contact": 5, "summary": 10, "skills": 15, "experience": 20,
                "projects": 15, "education": 10, "certifications": 5,
                "achievements": 5, "keywords": 5, "formatting": 5, "links": 5
            },
            "skills": [],
            "sections": {},
            "strengths": [],
            "weaknesses": ["No readable text extracted from document."],
            "missing_sections": ["Contact", "Summary", "Skills", "Education", "Projects"],
            "missing_keywords": [],
            "suggestions": [
                "Document appears blank or unreadable by text extraction.",
                "Ensure your resume is a standard text-based PDF or DOCX file (not a raster image scan)."
            ],
            "skill_evidence": []
        }

    sections = extract_all_sections(text)
    header_text = sections.get("header", "")
    exp_text = sections.get("experience", "")
    edu_text = sections.get("education", "")

    # 1. Detect candidate profile type (fresher vs experienced)
    candidate_type = detect_candidate_type(text, exp_text, edu_text)

    # 2. Determine category max weights
    if candidate_type == "fresher":
        # Rebalanced weights for freshers: projects & education rewarded higher
        weights = {
            "contact": 5,
            "summary": 10,
            "skills": 18,
            "experience": 5,     # Internships/academic training evaluated here
            "projects": 22,       # Core indicator for freshers
            "education": 12,      # Crucial for freshers
            "certifications": 6,
            "achievements": 6,
            "keywords": 5,
            "formatting": 5,
            "links": 6
        }
    else:
        # Standard weights for experienced professionals
        weights = {
            "contact": 5,
            "summary": 10,
            "skills": 15,
            "experience": 20,
            "projects": 15,
            "education": 10,
            "certifications": 5,
            "achievements": 5,
            "keywords": 5,
            "formatting": 5,
            "links": 5
        }

    # 3. Evaluate each dimension
    contact_res = evaluate_contact(text, header_text)
    summary_res = evaluate_summary(sections.get("summary", ""), candidate_type)
    skills_res = evaluate_skills(sections, text, max_score=weights["skills"])
    exp_res = evaluate_experience(sections, candidate_type, max_score=weights["experience"])
    proj_res = evaluate_projects(sections, candidate_type, max_score=weights["projects"])
    edu_res = evaluate_education(sections, max_score=weights["education"])
    cert_res, achieve_res = evaluate_certifications_and_achievements(
        sections, text, cert_max=weights["certifications"], achieve_max=weights["achievements"]
    )
    detected_skills = skills_res["detected_skills"]
    kw_res, fmt_res = evaluate_formatting_and_keywords(text, sections, detected_skills)

    # Contact & links separation
    contact_score = min(weights["contact"], contact_res["contact_score"])
    links_score = min(weights["links"], round(contact_res["links_score"] * (weights["links"] / 5.0)))

    category_scores = {
        "contact": contact_score,
        "summary": summary_res["score"],
        "skills": skills_res["score"],
        "experience": exp_res["score"],
        "projects": proj_res["score"],
        "education": edu_res["score"],
        "certifications": cert_res["score"],
        "achievements": achieve_res["score"],
        "keywords": kw_res["score"],
        "formatting": fmt_res["score"],
        "links": links_score
    }

    # 4. Total raw score (sum of all categories, capped at 100)
    raw_total = sum(category_scores.values())
    ats_score = max(5, min(100, raw_total))

    # 5. Detect missing sections
    missing_sections = []
    if not summary_res["present"]:
        missing_sections.append("Professional Summary / Objective")
    if not skills_res["has_skills_section"]:
        missing_sections.append("Technical Skills Section")
    if not proj_res["has_projects"]:
        missing_sections.append("Projects")
    if not edu_res["has_education"]:
        missing_sections.append("Education")
    if not exp_res["has_experience"] and candidate_type == "experienced":
        missing_sections.append("Work Experience")
    if not cert_res["has_certifications"]:
        missing_sections.append("Certifications")
    if not contact_res["details"]["github"] and not contact_res["details"]["linkedin"]:
        missing_sections.append("Professional Profiles (GitHub / LinkedIn)")

    # 6. Generate dynamic Strengths ("Why this score" - positive points)
    strengths = []
    if contact_res["details"]["email"] and contact_res["details"]["phone"]:
        strengths.append("Complete, ATS-compliant contact details (Email and Phone clearly identified).")
    if contact_res["details"]["github"] and contact_res["details"]["linkedin"]:
        strengths.append("Strong professional presence with both GitHub and LinkedIn profiles provided.")
    elif contact_res["details"]["github"]:
        strengths.append("GitHub profile included to showcase active code repositories.")
    elif contact_res["details"]["linkedin"]:
        strengths.append("LinkedIn profile included for recruiter verification.")

    if summary_res["present"] and not summary_res["is_generic"]:
        strengths.append("Targeted professional summary communicating candidate focus without generic filler phrases.")

    if len(detected_skills) >= 8:
        strengths.append(f"Broad technical stack: {len(detected_skills)} industry skills indexed across core domains.")
    elif len(detected_skills) >= 4:
        strengths.append(f"Solid foundational skills indexed: {', '.join(detected_skills[:4])}.")

    if proj_res["has_projects"]:
        strengths.append("Dedicated Projects section demonstrates practical implementation of technologies.")
        if proj_res["has_links"]:
            strengths.append("Projects include accessible repository/demo links for evidence.")

    if exp_res["has_experience"]:
        if exp_res["has_metrics"]:
            strengths.append("Experience bullet points feature quantifiable business metrics and results.")
        if exp_res["action_verb_count"] >= 3:
            strengths.append("Effective utilization of strong action verbs to describe responsibilities.")

    if edu_res["has_education"] and edu_res["degree_found"]:
        strengths.append("Accredited degree and institution background cleanly structured.")

    if cert_res["has_certifications"]:
        strengths.append("Relevant certifications included to validate specialized expertise.")

    if achieve_res["has_achievements"]:
        strengths.append("Competitive achievements / hackathons demonstrate initiative beyond coursework.")

    # 7. Generate dynamic Weaknesses & Points Lost ("Why this score" - deductions)
    weaknesses = []
    if not contact_res["details"]["github"]:
        weaknesses.append("Missing GitHub profile link (crucial for software and developer evaluations).")
    if not contact_res["details"]["linkedin"]:
        weaknesses.append("Missing LinkedIn profile link (widely expected by technical recruiters).")
    if not contact_res["details"]["location"]:
        weaknesses.append("No city/location mentioned in contact header.")

    if not summary_res["present"]:
        weaknesses.append("Missing Professional Summary: A 3-4 line summary helps ATS and hiring managers quickly categorize your profile.")
    elif summary_res["is_generic"]:
        weaknesses.append("Summary appears generic: Replace generic phrases with your exact target role and top 3 technologies.")

    if len(detected_skills) < 6:
        weaknesses.append(f"Skills section only lists {len(detected_skills)} skills: Industry benchmark recommends 8-12 core skills.")

    if not proj_res["has_projects"]:
        weaknesses.append("Missing technical projects: Projects provide primary proof of hands-on ability.")
    elif not proj_res["has_links"]:
        weaknesses.append("Project bullet points lack live demo or GitHub links for instant verification.")

    if exp_res["has_experience"] and not exp_res["has_metrics"]:
        weaknesses.append("Experience bullet points lack quantifiable metrics (e.g., % performance gain, user count, time saved).")

    if not edu_res["year_found"]:
        weaknesses.append("Graduation year not explicitly specified under Education.")

    if not cert_res["has_certifications"]:
        weaknesses.append("No technical certifications detected to support self-learning.")

    if fmt_res["risk_level"] != "Low Risk":
        weaknesses.append(f"Formatting check ({fmt_res['risk_level']}): Ensure bullet points are concise and section titles standard.")

    # 8. Actionable Suggestions (preserves existing backward compatibility)
    suggestions = []
    if len(detected_skills) < 8:
        suggestions.append("Add more core technical skills to your Skills section to improve search ranking.")
    if "git" not in detected_skills and "github" not in detected_skills:
        suggestions.append("Mention version control (Git / GitHub) in your Skills section.")
    if "docker" not in detected_skills and "kubernetes" not in detected_skills:
        suggestions.append("Include containerization tools (Docker / Kubernetes) to demonstrate deployment capability.")
    if "aws" not in detected_skills and "azure" not in detected_skills:
        suggestions.append("Cloud skills (AWS / Azure) significantly enhance candidate ranking in modern stacks.")
    if not contact_res["details"]["linkedin"]:
        suggestions.append("Add a clickable LinkedIn profile link in the top contact header.")
    if not contact_res["details"]["github"]:
        suggestions.append("Add your GitHub profile URL to showcase open-source projects.")
    if not summary_res["present"]:
        suggestions.append("Add a 3-line Professional Summary highlighting your primary engineering stack.")
    if exp_res["has_experience"] and not exp_res["has_metrics"]:
        suggestions.append("Include numbers and metrics in bullet points (e.g., 'improved performance by 25%').")

    # 9. Skill evidence mapping
    skill_evidence = []
    text_lower = text.lower()
    for sk in detected_skills:
        in_skills = bool(sections.get("skills") and re.search(r"\b" + re.escape(sk) + r"\b", sections["skills"].lower()))
        in_projects = bool(sections.get("projects") and re.search(r"\b" + re.escape(sk) + r"\b", sections["projects"].lower()))
        in_exp = bool(sections.get("experience") and re.search(r"\b" + re.escape(sk) + r"\b", sections["experience"].lower()))
        evidence_status = "Strong Evidence" if (in_projects or in_exp) else "Listed in Skills"
        skill_evidence.append({
            "skill": sk,
            "in_skills_section": in_skills,
            "in_projects": in_projects,
            "in_experience": in_exp,
            "evidence_status": evidence_status
        })

    return {
        "ats_score": ats_score,
        "candidate_type": candidate_type,
        "category_scores": category_scores,
        "category_max_scores": weights,
        "skills": detected_skills,
        "sections": {
            "contact": contact_res,
            "summary": summary_res,
            "skills": skills_res,
            "experience": exp_res,
            "projects": proj_res,
            "education": edu_res,
            "certifications": cert_res,
            "achievements": achieve_res,
            "keywords": kw_res,
            "formatting": fmt_res
        },
        "strengths": strengths[:6],
        "weaknesses": weaknesses[:6],
        "missing_sections": missing_sections,
        "missing_keywords": [kw for kw in ["Git", "Docker", "AWS", "REST API", "CI/CD"] if kw.lower() not in text_lower],
        "suggestions": suggestions if suggestions else ["Outstanding ATS compliance across all core dimensions!"],
        "skill_evidence": skill_evidence
    }