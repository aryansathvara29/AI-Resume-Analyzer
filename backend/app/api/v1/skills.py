import os
import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.skill_verification import SkillVerification
from app.dependencies.auth import get_current_user
from app.ai.gemini_service import (
    generate_skill_mcq_test,
    generate_multi_skill_mcq_test,
    generate_learning_resources,
    verify_certificate_document,
)

router = APIRouter()

UPLOAD_DIR = "uploads/certificates"
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


class GenerateTestRequest(BaseModel):
    skill_name: Optional[str] = None
    skills: Optional[List[str]] = None
    num_questions: Optional[int] = 5


class SubmitTestRequest(BaseModel):
    skill_name: str
    score: int
    total: int = 5
    resume_id: Optional[int] = None
    skills_passed: Optional[List[str]] = None


CURATED_SKILL_QUESTIONS = {
    "c": [
        {
            "question": "Which operator is used in C to get the memory address of a variable?",
            "options": ["*", "&", "->", "%"],
            "correct_index": 1
        },
        {
            "question": "Which standard library function dynamically allocates memory without initializing it to zero?",
            "options": ["calloc()", "malloc()", "realloc()", "alloc()"],
            "correct_index": 1
        },
        {
            "question": "What is the terminating character of a string in C?",
            "options": ["'\\0'", "'\\n'", "'EOF'", "';'"],
            "correct_index": 0
        },
        {
            "question": "What is the return type of the standard malloc() function in C?",
            "options": ["void*", "int*", "char*", "size_t"],
            "correct_index": 0
        },
        {
            "question": "Which keyword is used in C to prevent any modification to a variable's value?",
            "options": ["static", "const", "volatile", "immutable"],
            "correct_index": 1
        }
    ],
    "cpp": [
        {
            "question": "What does RAII stand for in modern C++?",
            "options": ["Resource Acquisition Is Initialization", "Runtime Allocations In Instances", "Recursive Algorithm Iteration Index", "Refactored Access In Interfaces"],
            "correct_index": 0
        },
        {
            "question": "Which smart pointer should be used for exclusive ownership of a dynamically allocated object?",
            "options": ["std::shared_ptr", "std::weak_ptr", "std::unique_ptr", "std::auto_ptr"],
            "correct_index": 2
        },
        {
            "question": "Which keyword allows a derived class method to override a base class method dynamically at runtime?",
            "options": ["static", "virtual", "inline", "extern"],
            "correct_index": 1
        },
        {
            "question": "What is the default member access level in a C++ 'class' versus a 'struct'?",
            "options": ["class is private by default, struct is public by default", "Both are public by default", "Both are private by default", "class is protected by default, struct is private by default"],
            "correct_index": 0
        },
        {
            "question": "Which keyword enables writing generic functions and classes in C++?",
            "options": ["generic", "template", "typename", "virtual"],
            "correct_index": 1
        }
    ],
    "python": [
        {
            "question": "What is the primary difference between a list and a tuple in Python?",
            "options": ["Lists are mutable while tuples are immutable", "Tuples can only store numbers", "Lists cannot be iterated over", "Tuples cannot hold heterogeneous data"],
            "correct_index": 0
        },
        {
            "question": "Which built-in function returns an iterator of tuples containing an index and the corresponding item?",
            "options": ["zip()", "enumerate()", "range()", "iter()"],
            "correct_index": 1
        },
        {
            "question": "How does Python handle memory management for unused objects?",
            "options": ["Manual deallocation with free()", "Reference counting with a cycle-detecting garbage collector", "Static compile-time memory maps", "Operating system swap only"],
            "correct_index": 1
        },
        {
            "question": "Which decorator in Python is used to define a method that receives the class itself as its first argument?",
            "options": ["@staticmethod", "@classmethod", "@property", "@abstractmethod"],
            "correct_index": 1
        },
        {
            "question": "What is the average time complexity of looking up a key in a standard Python dictionary?",
            "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
            "correct_index": 0
        }
    ],
    "java": [
        {
            "question": "What is the fundamental difference between == and .equals() for objects in Java?",
            "options": ["== compares memory references, while .equals() compares value/content", "== compares values, while .equals() checks class inheritance", ".equals() cannot be overridden", "Both always behave identically"],
            "correct_index": 0
        },
        {
            "question": "Which keyword prevents a class from being inherited or a method from being overridden in Java?",
            "options": ["static", "abstract", "final", "const"],
            "correct_index": 2
        },
        {
            "question": "Which data structure in Java does NOT allow duplicate elements?",
            "options": ["ArrayList", "LinkedList", "HashSet", "Vector"],
            "correct_index": 2
        },
        {
            "question": "In Java, which exception type is an unchecked exception (does not require mandatory catch or throws)?",
            "options": ["IOException", "SQLException", "RuntimeException", "ClassNotFoundException"],
            "correct_index": 2
        },
        {
            "question": "What is the primary component of the JVM responsible for converting frequently executed bytecode into native machine instructions?",
            "options": ["Class Loader", "Just-In-Time (JIT) Compiler", "Garbage Collector", "Bytecode Verifier"],
            "correct_index": 1
        }
    ],
    "javascript": [
        {
            "question": "What is the output of 'typeof NaN' in JavaScript?",
            "options": ["'undefined'", "'number'", "'NaN'", "'object'"],
            "correct_index": 1
        },
        {
            "question": "Which array method creates a new array with the results of calling a provided function on each element?",
            "options": ["forEach()", "map()", "filter()", "reduce()"],
            "correct_index": 1
        },
        {
            "question": "What is a closure in JavaScript?",
            "options": ["A function bundled together with references to its lexical environment", "A syntax error when a curly bracket is omitted", "A method to close browser tabs", "A built-in JSON parser"],
            "correct_index": 0
        },
        {
            "question": "What is the behavior of Promise.all() in JavaScript?",
            "options": ["Fulfills when all promises resolve, or rejects immediately when any promise rejects", "Waits for all promises to settle regardless of rejection", "Returns only the first resolved promise", "Executes promises synchronously"],
            "correct_index": 0
        },
        {
            "question": "Which keyword declarations introduce block-scoped variables in modern JavaScript?",
            "options": ["var only", "let and const", "function and var", "global and local"],
            "correct_index": 1
        }
    ],
    "html": [
        {
            "question": "Which HTML5 element represents the primary navigation section of a webpage?",
            "options": ["<header>", "<nav>", "<section>", "<aside>"],
            "correct_index": 1
        },
        {
            "question": "What is the primary purpose of the 'alt' attribute on an <img> tag?",
            "options": ["Provides alternative text when image cannot be displayed or for screen readers", "Defines the tooltip text on hover only", "Specifies the image alignment", "Caches the image in browser storage"],
            "correct_index": 0
        },
        {
            "question": "Which attribute in a form input specifies that an input field must be filled out before submitting?",
            "options": ["validate", "mandatory", "required", "checked"],
            "correct_index": 2
        },
        {
            "question": "Which HTML5 semantic element should be used for standalone, distributable content like articles or blog posts?",
            "options": ["<article>", "<div>", "<aside>", "<main>"],
            "correct_index": 0
        },
        {
            "question": "Which element provides a caption or legend for a <figure> element in HTML5?",
            "options": ["<caption>", "<figcaption>", "<title>", "<summary>"],
            "correct_index": 1
        }
    ],
    "css": [
        {
            "question": "In the standard CSS box model, what is the order from innermost to outermost?",
            "options": ["Content, Padding, Border, Margin", "Content, Border, Padding, Margin", "Margin, Border, Padding, Content", "Padding, Content, Border, Margin"],
            "correct_index": 0
        },
        {
            "question": "Which CSS property specifies whether an element is treated as a flex container?",
            "options": ["flex-direction", "display: flex", "align-items", "justify-content"],
            "correct_index": 1
        },
        {
            "question": "What CSS property controls the stacking order of positioned elements along the z-axis?",
            "options": ["z-index", "elevation", "layer-order", "position-depth"],
            "correct_index": 0
        },
        {
            "question": "In CSS Grid layout, which flexible unit represents a fraction of the available free space in the grid container?",
            "options": ["%", "em", "fr", "vw"],
            "correct_index": 2
        },
        {
            "question": "Which CSS pseudo-class matches elements only when focused via keyboard navigation (such as Tab)?",
            "options": [":focus", ":focus-visible", ":active", ":hover"],
            "correct_index": 1
        }
    ],
    "react": [
        {
            "question": "What is the primary role of the useEffect hook in React functional components?",
            "options": ["To handle side effects like data fetching, subscriptions, or DOM mutations", "To directly mutate the Virtual DOM", "To declare global Redux actions", "To prevent component re-renders completely"],
            "correct_index": 0
        },
        {
            "question": "Why does React require unique 'key' props when rendering lists of elements?",
            "options": ["To optimize reconciliation and efficiently track which items have changed or moved", "To apply unique CSS styles", "To store element data in local storage", "To assign unique HTML IDs"],
            "correct_index": 0
        },
        {
            "question": "How should state updates that depend on previous state values be performed in React?",
            "options": ["Pass an updater callback function to setState (e.g. setCount(prev => prev + 1))", "Directly mutate state.variable", "Call forceUpdate() immediately", "Use window.location.reload()"],
            "correct_index": 0
        },
        {
            "question": "Which React hook is designed to memoize the result of an expensive calculation between renders?",
            "options": ["useCallback", "useMemo", "useRef", "useEffect"],
            "correct_index": 1
        },
        {
            "question": "What is the fundamental difference between controlled and uncontrolled form inputs in React?",
            "options": ["Controlled inputs have their values driven by React state; uncontrolled inputs store their own state in the DOM", "Controlled inputs do not support onChange handlers", "Uncontrolled inputs cannot be submitted in HTML forms", "Both behave identically in React 18"],
            "correct_index": 0
        }
    ],
    "sql": [
        {
            "question": "Which SQL clause is used to filter aggregates created by GROUP BY?",
            "options": ["WHERE", "HAVING", "ORDER BY", "FILTER"],
            "correct_index": 1
        },
        {
            "question": "What is the result of an INNER JOIN between Table A and Table B?",
            "options": ["Rows that have matching values in both tables", "All rows from Table A and only matching rows from Table B", "All rows from both tables including non-matching NULLs", "A Cartesian product of all rows"],
            "correct_index": 0
        },
        {
            "question": "What is the primary benefit of creating an index on a database column?",
            "options": ["Speeds up data retrieval queries (SELECT)", "Reduces the disk storage used by the table", "Prevents duplicate values automatically across all columns", "Speeds up write operations (INSERT/UPDATE)"],
            "correct_index": 0
        },
        {
            "question": "Which SQL constraint ensures that all values in a column are distinct and cannot be NULL?",
            "options": ["UNIQUE", "PRIMARY KEY", "CHECK", "FOREIGN KEY"],
            "correct_index": 1
        },
        {
            "question": "Which SQL statement is used to remove all records from a table without logging individual row deletions?",
            "options": ["DROP TABLE", "DELETE FROM", "TRUNCATE TABLE", "REMOVE ALL"],
            "correct_index": 2
        }
    ]
}


def build_fallback_for_skill(skill: str, start_id: int = 1, min_q: int = 5):
    skill_clean = skill.strip().lower()
    if skill_clean in CURATED_SKILL_QUESTIONS:
        curated = CURATED_SKILL_QUESTIONS[skill_clean]
        res = []
        for i, q in enumerate(curated[:min_q]):
            res.append({
                "id": start_id + i,
                "skill": skill.capitalize(),
                "question": q["question"],
                "options": q["options"],
                "correct_index": q["correct_index"]
            })
        return res

    # Generic technical interview MCQs with minimum 5 questions
    return [
        {
            "id": start_id,
            "skill": skill.capitalize(),
            "question": f"In {skill}, what is the recommended best practice for modular code and error management?",
            "options": [
                f"Structuring reusable modules and validating inputs with proper exception handling in {skill}",
                "Disabling runtime errors and logging",
                "Writing all logic into a single monolithic entry file",
                "Hardcoding all configurations into global scope"
            ],
            "correct_index": 0
        },
        {
            "id": start_id + 1,
            "skill": skill.capitalize(),
            "question": f"Which of the following best represents standard performance optimization when working with {skill}?",
            "options": [
                "Ignoring memory consumption and query latencies",
                f"Leveraging efficient data structures, caching, and algorithmic efficiency in {skill}",
                "Using synchronous blocking loops for all I/O operations",
                "Compiling without optimization flags"
            ],
            "correct_index": 1
        },
        {
            "id": start_id + 2,
            "skill": skill.capitalize(),
            "question": f"When scaling or maintaining a production application built with {skill}, what is essential?",
            "options": [
                "Avoiding automated unit and integration testing",
                "Storing secrets in plain text repository commits",
                f"Writing automated tests, adhering to style guidelines, and continuous integration with {skill}",
                "Deploying manual binaries without version control tags"
            ],
            "correct_index": 2
        },
        {
            "id": start_id + 3,
            "skill": skill.capitalize(),
            "question": f"In {skill}, how should security vulnerabilities such as injection or unauthorized access be prevented?",
            "options": [
                f"By validating all user inputs, using parameterized interfaces, and following least privilege in {skill}",
                "By trusting all incoming client data unconditionally",
                "By disabling input sanitization to improve throughput",
                "By exposing internal error traces directly to clients"
            ],
            "correct_index": 0
        },
        {
            "id": start_id + 4,
            "skill": skill.capitalize(),
            "question": f"What is a fundamental debugging and profiling practice when analyzing bottlenecks in {skill}?",
            "options": [
                "Guessing without measuring execution metrics",
                f"Utilizing structured logging, APM profilers, and performance benchmarks in {skill}",
                "Removing all log statements from production builds",
                "Relying solely on user complaints to identify errors"
            ],
            "correct_index": 1
        }
    ]


@router.get("/verifications")
def get_user_skill_verifications(
    resume_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SkillVerification).filter(SkillVerification.user_id == current_user.id)
    if resume_id is not None:
        query = query.filter(SkillVerification.resume_id == resume_id)
    records = query.all()
    return records


from app.utils.resume_parser import extract_resume_text


@router.post("/verify/certificate")
async def verify_skill_by_certificate(
    skill_name: str = Form(...),
    resume_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    clean_skill = skill_name.strip()
    original_filename = file.filename or "certificate.pdf"
    clean_filename = original_filename.strip()
    ext = os.path.splitext(clean_filename)[1].lower()
    content_type = (file.content_type or "").lower()

    is_valid_ext = ext in ALLOWED_EXTENSIONS
    is_valid_mime = any(m in content_type for m in ["pdf", "image", "png", "jpeg", "jpg"])

    if not (is_valid_ext or is_valid_mime):
        raise HTTPException(
            status_code=400,
            detail={
                "error_type": "INVALID_FORMAT",
                "status": "CERTIFICATE_REJECTED",
                "message": "Invalid file format. Only PDF, PNG, JPG, and JPEG files are supported.",
                "reason": "Invalid file format. Only PDF, PNG, JPG, and JPEG files are supported.",
                "claimed_skill": clean_skill
            }
        )

    if not ext:
        ext = ".pdf" if "pdf" in content_type else ".png"

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail={
                "error_type": "FILE_TOO_LARGE",
                "status": "CERTIFICATE_REJECTED",
                "message": "File size exceeds maximum limit of 5 MB.",
                "reason": "File size exceeds maximum limit of 5 MB.",
                "claimed_skill": clean_skill
            }
        )

    # Temporary write to disk for text extraction if PDF
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    extracted_text = ""
    if ext == ".pdf":
        try:
            extracted_text = extract_resume_text(file_path)
        except Exception as e:
            print(f"[WARNING] Certificate text extraction error: {e}")

    # Determine standard MIME type for Gemini
    mime_for_ai = content_type
    if not mime_for_ai:
        mime_for_ai = "application/pdf" if ext == ".pdf" else "image/png"

    # Strict Content-based AI Validation (Filename is NEVER used as proof)
    cert_result = verify_certificate_document(
        file_bytes=file_bytes,
        mime_type=mime_for_ai,
        claimed_skill=clean_skill,
        extracted_text=extracted_text
    )

    is_verified = cert_result.get("status") == "verified" and cert_result.get("is_certificate") and cert_result.get("skill_relevant")

    # Query existing verification record scoped by resume_id
    query = db.query(SkillVerification).filter(
        SkillVerification.user_id == current_user.id,
        SkillVerification.skill_name.ilike(clean_skill)
    )
    if resume_id is not None:
        query = query.filter(SkillVerification.resume_id == resume_id)
    else:
        query = query.filter(SkillVerification.resume_id.is_(None))

    record = query.first()

    if is_verified:
        # Save certificate record as officially verified
        if not record:
            record = SkillVerification(
                user_id=current_user.id,
                resume_id=resume_id,
                skill_name=clean_skill,
                status="verified_certificate",
                certificate_file_name=file.filename,
                certificate_file_path=file_path,
                certificate_title=cert_result.get("certificate_title"),
                issuer=cert_result.get("issuer"),
                detected_skill=cert_result.get("matched_skill"),
                confidence=cert_result.get("confidence"),
                verification_reason=cert_result.get("reason"),
            )
            db.add(record)
        else:
            record.status = "verified_certificate"
            record.certificate_file_name = file.filename
            record.certificate_file_path = file_path
            record.certificate_title = cert_result.get("certificate_title")
            record.issuer = cert_result.get("issuer")
            record.detected_skill = cert_result.get("matched_skill")
            record.confidence = cert_result.get("confidence")
            record.verification_reason = cert_result.get("reason")
            if resume_id is not None:
                record.resume_id = resume_id

        db.commit()
        db.refresh(record)

        return {
            "success": True,
            "status": "VERIFIED_CERTIFICATE",
            "verification_status": "VERIFIED_CERTIFICATE",
            "skill_name": clean_skill,
            "matched_skill": cert_result.get("matched_skill") or clean_skill,
            "certificate_title": cert_result.get("certificate_title") or f"{clean_skill} Certification",
            "issuer": cert_result.get("issuer") or "Verified Academy",
            "confidence": cert_result.get("confidence", 0.95),
            "reason": cert_result.get("reason", "Certificate content verified successfully."),
            "verification_method": "AI Certificate Analysis",
            "record": {
                "id": record.id,
                "skill_name": record.skill_name,
                "status": record.status,
                "certificate_file_name": record.certificate_file_name,
                "certificate_title": record.certificate_title,
                "issuer": record.issuer,
                "detected_skill": record.detected_skill,
                "confidence": record.confidence,
                "verification_reason": record.verification_reason
            }
        }
    else:
        # Clean up file on rejection
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

        # Update or record rejection in database
        if record:
            record.status = "certificate_rejected"
            record.detected_skill = cert_result.get("matched_skill")
            record.certificate_title = cert_result.get("certificate_title")
            record.issuer = cert_result.get("issuer")
            record.confidence = cert_result.get("confidence")
            record.verification_reason = cert_result.get("reason")
            db.commit()

        error_type = "WRONG_SKILL" if cert_result.get("is_certificate") else "INVALID_CERTIFICATE"
        
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error_type": error_type,
                "status": "CERTIFICATE_REJECTED",
                "verification_status": "CERTIFICATE_REJECTED",
                "claimed_skill": clean_skill,
                "detected_skill": cert_result.get("matched_skill"),
                "certificate_title": cert_result.get("certificate_title"),
                "issuer": cert_result.get("issuer"),
                "confidence": cert_result.get("confidence"),
                "is_certificate": cert_result.get("is_certificate"),
                "reason": cert_result.get("reason") or f"This certificate does not appear to verify the selected skill: {clean_skill}."
            }
        )


@router.post("/generate-test")
def generate_test(
    body: GenerateTestRequest,
    current_user: User = Depends(get_current_user),
):
    min_q = max(body.num_questions or 5, 5)

    # Multi-skill test generation
    if body.skills and len(body.skills) > 0:
        cleaned_skills = [s.strip() for s in body.skills if s.strip()]
        try:
            raw_json = generate_multi_skill_mcq_test(cleaned_skills, min_per_skill=min_q)
            questions = json.loads(raw_json)
            if isinstance(questions, list) and len(questions) >= len(cleaned_skills) * min_q:
                return {
                    "skills": cleaned_skills,
                    "questions": questions
                }
        except Exception as e:
            print("Gemini multi-skill test generation error:", e)

        # Fallback ensuring strictly 5 questions per skill
        all_fallback = []
        cur_id = 1
        for s in cleaned_skills:
            fb_list = build_fallback_for_skill(s, start_id=cur_id, min_q=min_q)
            all_fallback.extend(fb_list)
            cur_id += len(fb_list)

        return {
            "skills": cleaned_skills,
            "questions": all_fallback
        }

    # Single skill test generation (5 questions)
    target_skill = body.skill_name or "General Technology"
    try:
        raw_json = generate_skill_mcq_test(target_skill, num_questions=min_q)
        questions = json.loads(raw_json)
        if isinstance(questions, list) and len(questions) >= min_q:
            return {
                "skill_name": target_skill,
                "questions": questions
            }
    except Exception as e:
        print("Gemini single-skill test generation error:", e)

    fallback_q = build_fallback_for_skill(target_skill, start_id=1, min_q=min_q)
    return {
        "skill_name": target_skill,
        "questions": fallback_q
    }


@router.post("/submit-test")
def submit_test(
    body: SubmitTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Passing rule: At least 3 correct out of 5 questions (>= 60%)
    total_q = max(body.total, 1)
    passed = (body.score >= 3) if total_q == 5 else ((body.score / total_q) >= 0.60)
    status_str = "verified_ai_test" if passed else "learning_recommended"
    resources = None

    if not passed:
        try:
            raw_resources = generate_learning_resources(body.skill_name)
            resources = json.loads(raw_resources)
        except Exception as e:
            print("Error generating learning resources:", e)
            resources = [
                {
                    "title": f"Official {body.skill_name} Documentation",
                    "type": "Documentation",
                    "url": f"https://www.google.com/search?q={body.skill_name}+official+documentation",
                    "difficulty": "Beginner to Advanced",
                    "estimated_time": "10 Hours"
                },
                {
                    "title": f"FreeCodeCamp {body.skill_name} Full Course",
                    "type": "Course",
                    "url": f"https://www.youtube.com/results?search_query=freecodecamp+{body.skill_name}",
                    "difficulty": "Beginner",
                    "estimated_time": "5 Hours"
                }
            ]

    # If multi-skills passed, verify each of them
    if body.skills_passed and len(body.skills_passed) > 0:
        for s in body.skills_passed:
            q = db.query(SkillVerification).filter(
                SkillVerification.user_id == current_user.id,
                SkillVerification.skill_name.ilike(s.strip())
            )
            if body.resume_id is not None:
                q = q.filter(SkillVerification.resume_id == body.resume_id)
            rec = q.first()
            if not rec:
                rec = SkillVerification(
                    user_id=current_user.id,
                    resume_id=body.resume_id,
                    skill_name=s.strip(),
                    status="verified_ai_test" if passed else "learning_recommended",
                    score=body.score,
                    learning_resources=resources if not passed else None
                )
                db.add(rec)
            else:
                rec.status = "verified_ai_test" if passed else "learning_recommended"
                rec.score = body.score
                if body.resume_id is not None:
                    rec.resume_id = body.resume_id
                if not passed:
                    rec.learning_resources = resources
        db.commit()

    # Upsert main verification record scoped by resume_id
    query = db.query(SkillVerification).filter(
        SkillVerification.user_id == current_user.id,
        SkillVerification.skill_name.ilike(body.skill_name)
    )
    if body.resume_id is not None:
        query = query.filter(SkillVerification.resume_id == body.resume_id)
    else:
        query = query.filter(SkillVerification.resume_id.is_(None))

    record = query.first()

    if not record:
        record = SkillVerification(
            user_id=current_user.id,
            resume_id=body.resume_id,
            skill_name=body.skill_name,
            status=status_str,
            score=body.score,
            learning_resources=resources
        )
        db.add(record)
    else:
        record.status = status_str
        record.score = body.score
        if body.resume_id is not None:
            record.resume_id = body.resume_id
        if not passed:
            record.learning_resources = resources

    db.commit()
    db.refresh(record)

    return {
        "skill_name": body.skill_name,
        "score": body.score,
        "total": body.total,
        "passed": passed,
        "status": status_str,
        "learning_resources": resources
    }
