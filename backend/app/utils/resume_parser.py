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