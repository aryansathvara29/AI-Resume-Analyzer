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
        raise Exception(f"PDF parsing failed: {str(e)}")

    return text.strip()


# -------------------------
# DOCX TEXT EXTRACTION
# -------------------------
def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise Exception(f"DOCX parsing failed: {str(e)}")


# -------------------------
# MAIN FUNCTION (AUTO DETECT)
# -------------------------
def extract_resume_text(file_path: str) -> str:
    if file_path.endswith(".pdf"):
        return extract_text_from_pdf(file_path)

    elif file_path.endswith(".docx"):
        return extract_text_from_docx(file_path)

    else:
        raise ValueError("Unsupported file format. Only PDF and DOCX allowed.")