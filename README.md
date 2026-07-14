# 🤖 AI Resume Analyzer & Career Coach

An intelligent, full-stack web application that leverages GenAI and Natural Language Processing to analyze resumes, score them against Applicant Tracking Systems (ATS), provide comparative job matching, generate personalized career roadmaps, conduct mock technical interviews, and act as an AI career advisor.

---

## ✨ Features

- **📄 Resume Parsing & Parsing Support:** Extract text contents seamlessly from PDF (`.pdf`) and Word (`.docx`) documents.
- **📊 ATS Scoring & Analytics:** Automatically compute compatibility ratings based on a master skills database, highlighting strengths, weaknesses, and identifying missing skills.
- **💼 Job Description Matching:** Compare your resume with a specific job description to receive a match score, comparison analysis, and improvement suggestions.
- **🗺️ Interactive Career Roadmap Generator:** Generate step-by-step personalized development paths, including recommended learning milestones, certifications, and target project suggestions.
- **💬 AI Career Advisor Chatbot:** Chat with a persistent AI advisor context-aware of your resume to discuss career roadmaps, interview preparations, or placement tips.
- **🎯 AI Mock Interview Coach:** Simulate technical interviews by answering tailored questions and receiving detailed feedback, rating scores (out of 10), and model answers.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vite.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **HTTP Client:** [Axios](https://axios-http.com/)

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **ASGI Server:** [Uvicorn](https://www.uvicorn.org/)
- **ORM:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- **Database:** PostgreSQL (with fallback to SQLite for local development)
- **Document Extractors:** `pdfplumber` (for PDF analysis) and `python-docx` (for Word documents)

### Artificial Intelligence
- **LLM Provider:** [Google Gemini API](https://ai.google.dev/) (`gemini-2.5-flash` model via the official `google-generativeai` SDK)

---

## 📁 Repository Structure

```text
AI-Resume-Analyzer/
├── backend/                  # FastAPI Backend application
│   ├── app/
│   │   ├── ai/               # Gemini AI prompt orchestration
│   │   ├── api/              # API router and endpoints (V1)
│   │   ├── database/         # Session manager and migrations
│   │   ├── models/           # SQLAlchemy models (User, Resume, History)
│   │   ├── services/         # Master skills dictionary & ATS scoring
│   │   └── main.py           # Application entry point
│   ├── .env                  # Backend configuration & API keys
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── pages/            # View pages (Dashboard, Login)
│   │   └── main.tsx          # Frontend entry point
│   ├── package.json          # Node dependencies and scripts
│   └── vite.config.ts        # Vite configuration
│
├── vercel.json               # Frontend routing redirect configuration
└── requirements.txt          # Global requirements list
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- PostgreSQL (Optional; falls back to SQLite automatically if database URL is omitted)
- [Google Gemini API Key](https://aistudio.google.com/)

---

### 🔧 Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment & activate it:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables:**
   Create a `.env` file inside the `backend/` directory:
   ```env
   # PostgreSQL Connection (Comment out to fall back to local SQLite database automatically)
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/ai_resume_analyzer

   # Security Configurations
   SECRET_KEY=generate_a_random_long_secret_string
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # Gemini API Credentials
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

5. **Start the FastAPI backend server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The interactive API documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).*

---

### 💻 Frontend Setup

1. **Navigate to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   *The frontend application will be running at [http://localhost:5173](http://localhost:5173).*

---

## 🔒 Authentication & API Flow

- JWT tokens are generated on successful user logins.
- Include the authorization header in API requests:
  `Authorization: Bearer <your_jwt_token>`
- Database fallback logs are printed to console at startup to confirm database engines and connection statuses.

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
