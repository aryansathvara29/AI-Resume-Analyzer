import io
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib import colors


def sanitize_for_pdf(text: str) -> str:
    if not text:
        return ""
    replacements = {
        '\u22c4': '•',
        '\u2022': '•',
        '\u25cf': '•',
        '\u25cb': 'o',
        '\u25aa': '-',
        '\u2013': '-',
        '\u2014': '--',
        '\u2018': "'",
        '\u2019': "'",
        '\u201c': '"',
        '\u201d': '"',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text.encode('latin-1', 'replace').decode('latin-1')


def generate_resume_pdf(candidate_name: str, candidate_email: str, text: str, user_meta: dict = None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )
    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#2563EB'),
        fontName='Helvetica'
    )
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#1E293B'),
        fontName='Helvetica'
    )
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#1E3A8A'),
        fontName='Helvetica-Bold',
        spaceBefore=7,
        spaceAfter=3
    )

    story = []
    story.append(Paragraph(sanitize_for_pdf(candidate_name or "Candidate Resume"), title_style))
    contact = []
    if candidate_email:
        contact.append(candidate_email)
    if user_meta:
        if user_meta.get('phone'):
            contact.append(user_meta['phone'])
        if user_meta.get('city'):
            loc = user_meta['city']
            if user_meta.get('state'):
                loc += f", {user_meta['state']}"
            contact.append(loc)
        if user_meta.get('college'):
            contact.append(user_meta['college'])

    if contact:
        story.append(Paragraph(sanitize_for_pdf("  •  ".join(contact)), sub_style))

    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceBefore=2, spaceAfter=8))

    for line in (text or "").splitlines():
        clean = line.strip()
        if not clean:
            story.append(Spacer(1, 3))
            continue
        clean = sanitize_for_pdf(clean)
        safe = clean.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        if len(clean) < 40 and (clean.isupper() or clean.endswith(':') or clean.lower() in [
            'education', 'skills', 'experience', 'projects', 'certifications', 'summary',
            'technical skills', 'work experience', 'academic background', 'languages', 'tools'
        ]):
            story.append(Paragraph(safe, heading_style))
        else:
            story.append(Paragraph(safe, body_style))

    doc.build(story)
    return buffer.getvalue()


def resolve_resume_path(file_path: str) -> str | None:
    if not file_path:
        return None
    # 1. Direct check
    if os.path.isabs(file_path) and os.path.exists(file_path):
        return file_path
    if os.path.exists(file_path):
        return os.path.abspath(file_path)

    # 2. Check relative to backend dir
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    c1 = os.path.join(backend_dir, file_path)
    if os.path.exists(c1):
        return c1
    c2 = os.path.join(backend_dir, "uploads", os.path.basename(file_path))
    if os.path.exists(c2):
        return c2

    # 3. Check relative to root dir
    root_dir = os.path.dirname(backend_dir)
    c3 = os.path.join(root_dir, "backend", "uploads", os.path.basename(file_path))
    if os.path.exists(c3):
        return c3
    c4 = os.path.join(root_dir, "uploads", os.path.basename(file_path))
    if os.path.exists(c4):
        return c4

    # 4. Check relative to current working directory
    c5 = os.path.join(os.getcwd(), file_path)
    if os.path.exists(c5):
        return c5
    c6 = os.path.join(os.getcwd(), "uploads", os.path.basename(file_path))
    if os.path.exists(c6):
        return c6

    return None
