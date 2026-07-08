import re


# -------------------------
# MASTER SKILL DATABASE
# -------------------------
SKILLS = [
    # Programming
    "python",
    "java",
    "c",
    "c++",
    "c#",
    "javascript",
    "typescript",
    "php",
    "go",
    "kotlin",
    "swift",
    "rust",

    # Web
    "html",
    "css",
    "react",
    "next.js",
    "vue",
    "angular",
    "tailwind",
    "bootstrap",

    # Backend
    "fastapi",
    "django",
    "flask",
    "spring",
    "spring boot",
    "node.js",
    "express",

    # Database
    "mysql",
    "postgresql",
    "mongodb",
    "sqlite",
    "oracle",

    # Tools
    "git",
    "github",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "linux",

    # AI
    "machine learning",
    "deep learning",
    "tensorflow",
    "pytorch",
    "opencv",
    "nlp",
    "openai",
    "gemini",

    # Others
    "rest api",
    "jwt",
    "sql",
]


# -------------------------
# FIND SKILLS
# -------------------------
def detect_skills(text: str):

    text = text.lower()

    found = []

    for skill in SKILLS:
        if re.search(r"\b" + re.escape(skill) + r"\b", text):
            found.append(skill)

    return sorted(list(set(found)))


# -------------------------
# ATS SCORE
# -------------------------
def calculate_ats_score(text: str):

    skills = detect_skills(text)

    score = min(len(skills) * 5, 100)

    suggestions = []

    if len(skills) < 8:
        suggestions.append(
            "Add more technical skills."
        )

    if "github" not in skills:
        suggestions.append(
            "Mention your GitHub profile."
        )

    if "docker" not in skills:
        suggestions.append(
            "Learn Docker."
        )

    if "aws" not in skills:
        suggestions.append(
            "Cloud skills (AWS/Azure) improve ATS score."
        )

    return {
        "ats_score": score,
        "skills": skills,
        "suggestions": suggestions,
    }