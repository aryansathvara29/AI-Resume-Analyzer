import re


# -------------------------
# MASTER SKILL DEFINITIONS & PATTERNS
# -------------------------
SKILL_DEFINITIONS = [
    # Programming Languages
    {"canonical": "c", "patterns": [r"\bc\b"]},
    {"canonical": "c++", "patterns": [r"\bc\+\+\b", r"\bcpp\b"]},
    {"canonical": "c#", "patterns": [r"\bc\#\b", r"\bcsharp\b"]},
    {"canonical": "java", "patterns": [r"\bjava\b(?!script)"]},
    {"canonical": "python", "patterns": [r"\bpython\b"]},
    {"canonical": "javascript", "patterns": [r"\bjavascript\b", r"\bjs\b"]},
    {"canonical": "typescript", "patterns": [r"\btypescript\b", r"\bts\b"]},
    {"canonical": "php", "patterns": [r"\bphp\b"]},
    {"canonical": "go", "patterns": [r"\bgo\b", r"\bgolang\b"]},
    {"canonical": "kotlin", "patterns": [r"\bkotlin\b"]},
    {"canonical": "swift", "patterns": [r"\bswift\b"]},
    {"canonical": "rust", "patterns": [r"\brust\b"]},
    {"canonical": "ruby", "patterns": [r"\bruby\b"]},

    # Web Technologies
    {"canonical": "html", "patterns": [r"\bhtml(?:5)?\b"]},
    {"canonical": "css", "patterns": [r"\bcss(?:3)?\b"]},
    {"canonical": "react", "patterns": [r"\breact(?:\.js)?\b", r"\breactjs\b"]},
    {"canonical": "next.js", "patterns": [r"\bnext(?:\.js)?\b", r"\bnextjs\b"]},
    {"canonical": "vue", "patterns": [r"\bvue(?:\.js)?\b", r"\bvuejs\b"]},
    {"canonical": "angular", "patterns": [r"\bangular(?:\.js)?\b", r"\bangularjs\b"]},
    {"canonical": "tailwind", "patterns": [r"\btailwind(?:\s*css)?\b"]},
    {"canonical": "bootstrap", "patterns": [r"\bbootstrap(?:5)?\b"]},

    # Backend
    {"canonical": "fastapi", "patterns": [r"\bfastapi\b"]},
    {"canonical": "django", "patterns": [r"\bdjango\b"]},
    {"canonical": "flask", "patterns": [r"\bflask\b"]},
    {"canonical": "spring", "patterns": [r"\bspring\b(?!boot)"]},
    {"canonical": "spring boot", "patterns": [r"\bspring\s*boot\b"]},
    {"canonical": "node.js", "patterns": [r"\bnode(?:\.js)?\b", r"\bnodejs\b"]},
    {"canonical": "express", "patterns": [r"\bexpress(?:\.js)?\b"]},
    {"canonical": "graphql", "patterns": [r"\bgraphql\b"]},

    # Databases
    {"canonical": "mysql", "patterns": [r"\bmysql\b"]},
    {"canonical": "postgresql", "patterns": [r"\bpostgres(?:ql)?\b"]},
    {"canonical": "mongodb", "patterns": [r"\bmongodb\b", r"\bmongo\b"]},
    {"canonical": "sqlite", "patterns": [r"\bsqlite(?:3)?\b"]},
    {"canonical": "oracle", "patterns": [r"\boracle\b"]},
    {"canonical": "sql", "patterns": [r"\bsql\b"]},
    {"canonical": "redis", "patterns": [r"\bredis\b"]},

    # Data Science & Analytics
    {"canonical": "numpy", "patterns": [r"\bnumpy\b"]},
    {"canonical": "pandas", "patterns": [r"\bpandas\b"]},
    {"canonical": "matplotlib", "patterns": [r"\bmatplotlib\b"]},
    {"canonical": "seaborn", "patterns": [r"\bseaborn\b"]},
    {"canonical": "scikit-learn", "patterns": [r"\bscikit[- ]learn\b", r"\bsklearn\b"]},

    # AI & Machine Learning
    {"canonical": "machine learning", "patterns": [r"\bmachine\s+learning\b", r"\bml\b"]},
    {"canonical": "deep learning", "patterns": [r"\bdeep\s+learning\b"]},
    {"canonical": "tensorflow", "patterns": [r"\btensorflow\b"]},
    {"canonical": "pytorch", "patterns": [r"\bpytorch\b"]},
    {"canonical": "opencv", "patterns": [r"\bopencv\b"]},
    {"canonical": "nlp", "patterns": [r"\bnlp\b", r"\bnatural\s+language\s+processing\b"]},
    {"canonical": "openai", "patterns": [r"\bopenai\b"]},
    {"canonical": "gemini", "patterns": [r"\bgemini(?:\s*ai)?\b"]},

    # Tools, DevOps & Cloud
    {"canonical": "git", "patterns": [r"\bgit\b(?!hub)"]},
    {"canonical": "github", "patterns": [r"\bgithub\b"]},
    {"canonical": "docker", "patterns": [r"\bdocker\b"]},
    {"canonical": "kubernetes", "patterns": [r"\bkubernetes\b", r"\bk8s\b"]},
    {"canonical": "aws", "patterns": [r"\baws\b", r"\bamazon\s+web\s+services\b"]},
    {"canonical": "azure", "patterns": [r"\bazure\b"]},
    {"canonical": "linux", "patterns": [r"\blinux\b"]},
    {"canonical": "rest api", "patterns": [r"\brest(?:ful)?\s*api[s]?\b"]},
    {"canonical": "jwt", "patterns": [r"\bjwt\b"]},
]

# Legacy flat list for backwards compatibility
SKILLS = [item["canonical"] for item in SKILL_DEFINITIONS]


# -------------------------
# SECTION BOUNDARY HEADERS
# -------------------------
SKILL_SECTION_HEADERS = [
    r"technical\s+skills?",
    r"key\s+skills?",
    r"core\s+competencies",
    r"core\s+skills?",
    r"skills?\s*(?:&|and)\s*abilities",
    r"skills?\s*(?:&|and)\s*proficiencies",
    r"skills?\s*(?:&|and)\s*expertise",
    r"areas\s+of\s+expertise",
    r"programming\s+skills?",
    r"it\s+skills?",
    r"computer\s+skills?",
    r"technologies",
    r"skills?",
]

OTHER_SECTION_HEADERS = [
    r"projects?",
    r"key\s+projects?",
    r"academic\s+projects?",
    r"personal\s+projects?",
    r"work\s+experience",
    r"professional\s+experience",
    r"additional\s+experience",
    r"relevant\s+experience",
    r"experience",
    r"employment\s+history",
    r"internships?",
    r"education",
    r"academic\s+background",
    r"academics?",
    r"qualifications?",
    r"certifications?",
    r"certificates?",
    r"achievements?",
    r"accomplishments?",
    r"awards?",
    r"honors?",
    r"publications?",
    r"research",
    r"summary",
    r"professional\s+summary",
    r"career\s+objective",
    r"objective",
    r"about\s+me",
    r"volunteer(?:ing)?",
    r"activities",
    r"extra[- ]curricular",
    r"languages\s+known",
    r"personal\s+details",
    r"declaration",
    r"references?",
    r"interests?",
    r"hobbies",
]


# -------------------------
# EXTRACT ONLY SKILLS SECTION
# -------------------------
def extract_skills_section_text(full_text: str) -> str:
    """
    Isolates and extracts ONLY the text inside the dedicated SKILLS section.
    Terminates when the next major section (Projects, Experience, Education, etc.) begins.
    Returns empty string if no dedicated skills section exists.
    """
    if not full_text or len(full_text.strip()) < 10:
        return ""

    lines = full_text.splitlines()
    in_skills_section = False
    skills_lines = []

    # Regex matching full-line headers
    start_pattern = re.compile(
        r"^(?:[\s\*\#\-\•]*)\b(" + "|".join(SKILL_SECTION_HEADERS) + r")\b[\s\:\-\|]*$",
        re.IGNORECASE
    )
    stop_pattern = re.compile(
        r"^(?:[\s\*\#\-\•]*)\b(" + "|".join(OTHER_SECTION_HEADERS) + r")\b[\s\:\-\|]*$",
        re.IGNORECASE
    )

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if in_skills_section:
                skills_lines.append("")
            continue

        if not in_skills_section:
            if start_pattern.match(stripped):
                in_skills_section = True
                continue
        else:
            # Check if another major section begins
            if stop_pattern.match(stripped):
                break
            skills_lines.append(stripped)

    # Multiline regex fallback for PDF columns / non-newline splits
    if not in_skills_section or not skills_lines:
        pattern = re.compile(
            r"(?:^|\n)\s*(?:\d+[\.\)]\s*)?(?:[\*\#\-\•]*)\s*\b("
            + "|".join(SKILL_SECTION_HEADERS)
            + r")\b\s*[\:\-\|]?\s*\n(.*?)(?=\n\s*(?:[\*\#\-\•]*)\s*\b(?:"
            + "|".join(OTHER_SECTION_HEADERS)
            + r")\b\s*[\:\-\|]?\s*\n|\Z)",
            re.IGNORECASE | re.DOTALL,
        )
        match = pattern.search(full_text)
        if match:
            return match.group(2).strip()
        return ""

    return "\n".join(skills_lines).strip()


# -------------------------
# FIND SKILLS (ONLY IN SKILLS SECTION)
# -------------------------
def detect_skills(text: str) -> list[str]:
    """
    Scans strictly within the resume's dedicated SKILLS section.
    If no SKILLS section exists, returns an empty list.
    """
    skills_section = extract_skills_section_text(text)
    if not skills_section:
        return []

    found = []
    section_lower = skills_section.lower()

    for item in SKILL_DEFINITIONS:
        for pat in item["patterns"]:
            if re.search(pat, section_lower, re.IGNORECASE):
                found.append(item["canonical"])
                break

    return sorted(list(set(found)))


# -------------------------
# ATS SCORE CALCULATION
# -------------------------
def calculate_ats_score(text: str) -> dict:
    """
    Calculates ATS score based exclusively on the skills present in the SKILLS section.
    If no SKILLS section is present or no skills are found in it, ATS score is strictly 0%.
    """
    skills_section = extract_skills_section_text(text)
    skills = detect_skills(text)

    # Strict requirement: if no skills section or no skills in skills section -> 0% ATS
    if not skills_section or len(skills) == 0:
        return {
            "ats_score": 0,
            "skills": [],
            "suggestions": [
                "No dedicated 'SKILLS' or 'TECHNICAL SKILLS' section found in your resume.",
                "ATS screening software requires a distinct Skills section to index candidate competencies.",
                "Add a clearly labeled 'SKILLS' section with your core programming languages, frameworks, and databases to achieve an ATS score."
            ],
        }

    # Proportional ATS score for skills in skills section
    score = min(round(len(skills) * 7.5), 100)

    suggestions = []

    if len(skills) < 8:
        suggestions.append("Add more technical skills to your Skills section to improve ranking.")

    if "github" not in skills and "git" not in skills:
        suggestions.append("Mention version control (Git/GitHub) in your Skills section.")

    if "docker" not in skills and "kubernetes" not in skills:
        suggestions.append("Include containerization tools (Docker) in your Skills section.")

    if "aws" not in skills and "azure" not in skills:
        suggestions.append("Cloud skills (AWS/Azure) improve ATS technical weight.")

    return {
        "ats_score": score,
        "skills": skills,
        "suggestions": suggestions,
    }