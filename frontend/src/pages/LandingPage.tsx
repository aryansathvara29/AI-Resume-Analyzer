import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  // State for interactive Live Demo Role Simulator
  const [selectedDemoRole, setSelectedDemoRole] = useState<"fullstack" | "aiml" | "devops" | "data">("fullstack");

  // State for Before / After Toggle in Hero
  const [heroView, setHeroView] = useState<"after" | "before">("after");

  // State for FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const demoRolesData = {
    fullstack: {
      title: "Full Stack Engineer",
      atsScore: 94,
      matched: ["React.js", "TypeScript", "Node.js", "FastAPI", "PostgreSQL", "Docker", "REST APIs"],
      missing: ["AWS Lambda", "GraphQL", "Redis Caching"],
      roadmap: "Phase 1: Master Distributed Caching (Redis) -> Phase 2: Deploy Serverless microservices on AWS -> Phase 3: Advanced System Design",
      interviewQuestion: "How do you optimize server-side rendering latency in modern React frameworks?",
    },
    aiml: {
      title: "AI / ML Engineer",
      atsScore: 91,
      matched: ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Gemini API", "FastAPI", "NLP"],
      missing: ["MLflow", "Kubeflow", "Vector Databases (Pinecone/Chroma)"],
      roadmap: "Phase 1: Vector Embeddings & RAG Architectures -> Phase 2: MLOps Pipeline Automation -> Phase 3: Fine-tuning LLMs",
      interviewQuestion: "Explain the tradeoff between precision and recall in imbalanced classification models.",
    },
    devops: {
      title: "Cloud & DevOps Architect",
      atsScore: 89,
      matched: ["Docker", "Kubernetes", "Linux", "Git", "AWS (EC2, S3)", "CI/CD Pipelines"],
      missing: ["Terraform (IaC)", "Prometheus / Grafana", "ArgoCD"],
      roadmap: "Phase 1: Infrastructure as Code with Terraform -> Phase 2: GitOps with ArgoCD -> Phase 3: Multi-Cloud Observability",
      interviewQuestion: "How do you implement zero-downtime blue-green deployments in Kubernetes?",
    },
    data: {
      title: "Data Scientist / Analyst",
      atsScore: 93,
      matched: ["SQL", "Python", "Pandas", "NumPy", "Tableau", "Statistical Modeling"],
      missing: ["Apache Spark", "Snowflake", "dbt (data build tool)"],
      roadmap: "Phase 1: Big Data processing with PySpark -> Phase 2: Modern Cloud Data Warehouses -> Phase 3: Automated ETL pipelines",
      interviewQuestion: "How would you design an A/B test when user network effects might cause interference?",
    },
  };

  const faqs = [
    {
      q: "How does the ATS scoring algorithm work?",
      a: "Our ATS Engine compares your resume against real-world job indexing patterns, analyzing keyword density, technical competencies, section structure, and formatting readability to give you an accurate compliance score.",
    },
    {
      q: "What makes the Gemini Deep Audit different from traditional checkers?",
      a: "Unlike simple keyword checkers, Google Gemini AI reads your resume like an experienced technical hiring manager. It evaluates project impact metrics, clarity of achievements, action verbs, and provides concrete rewrite suggestions.",
    },
    {
      q: "What happens if I upload an invalid document or college assignment?",
      a: "Our built-in Document Validator automatically screens uploaded files. It verifies standard Resume/CV sections (Education, Skills, Experience) and filters out college practical manuals, lab reports, assignments, or generic documents before scanning.",
    },
    {
      q: "How does Skill Verification and the AI Test work?",
      a: "You can verify skills in two ways: by uploading course/industry certificates (which our text engine validates for authenticity), or by taking a dynamic 10-question AI MCQ test. Scoring 5 or more marks earns you a verified skill badge.",
    },
    {
      q: "Is my resume data kept private and secure?",
      a: "Yes! Your resume files and parsed profiles are strictly isolated to your authenticated account. We do not sell your personal data or share your resumes with third parties.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white overflow-x-hidden font-sans">
      {/* BACKGROUND GLOW EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[550px] h-[550px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute top-[35%] right-[-5%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[160px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[150px]" />
      </div>

      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400">
                  <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.061l-.97-.97V19.5a2.25 2.25 0 0 1-2.25 2.25h-9.5A2.25 2.25 0 0 1 5.19 19.5v-6.878l-.97.97a.75.75 0 0 1-1.06-1.06l8.69-8.691Z" />
                </svg>
              </div>
            </div>
            <div className="whitespace-nowrap">
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap">
                AI Resume <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Analyzer</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block -mt-1">
                Gemini Powered
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#live-demo" className="hover:text-blue-400 transition-colors">Interactive Demo</a>
            <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-xs font-bold text-white hover:from-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 cursor-pointer"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative z-10 pt-16 pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-blue-500/30 text-xs font-bold text-blue-400 shadow-inner backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Next-Gen AI Resume Engine v2.0</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-medium">Powered by Gemini AI</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Turn Your Resume Into A{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              Recruiter Magnet
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto">
            Beat strict ATS keyword filters, receive in-depth Gemini AI recruiter audits, verify skills with adaptive tests, and map out your personalized career roadmap in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate("/login")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-sm font-bold text-white hover:from-blue-500 hover:to-violet-500 transition-all shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Scan Your Resume Free</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <a
              href="#live-demo"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-sm font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View Interactive Demo</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
              </svg>
            </a>
          </div>

          {/* Trust badge */}
          <div className="pt-6 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> Free Instant Analysis
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> PDF & DOCX Supported
            </span>
          </div>
        </div>

        {/* HERO INTERACTIVE SHOWCASE CARD */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-blue-500/30 via-indigo-500/10 to-transparent shadow-2xl shadow-blue-500/10">
            <div className="rounded-[22px] bg-slate-950/90 backdrop-blur-2xl border border-slate-800 p-6 sm:p-8 space-y-6">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-400">
                    Candidate Profile: <strong className="text-white">Aryan_FullStack_Resume.pdf</strong>
                  </span>
                </div>

                {/* Before / After Toggle */}
                <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 self-start sm:self-auto">
                  <button
                    onClick={() => setHeroView("before")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      heroView === "before"
                        ? "bg-slate-800 text-amber-400 shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Standard Resume (Before)
                  </button>
                  <button
                    onClick={() => setHeroView("after")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      heroView === "after"
                        ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    AI Optimized (After) ✨
                  </button>
                </div>
              </div>

              {/* Dynamic View Body */}
              {heroView === "after" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  {/* Gauge */}
                  <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-800"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-emerald-400 stroke-current"
                          strokeWidth="3"
                          strokeDasharray="95, 100"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-3xl font-black text-white">95%</span>
                        <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">ATS Score</span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-emerald-400">High Recruiter Indexing Match</p>
                    <p className="text-[11px] text-slate-400">Ready for automated enterprise portals</p>
                  </div>

                  {/* Verified Skills & Deep Audit */}
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Verified Skill Credentials (4)</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                          <span>✓</span> Java <span className="text-[10px] text-emerald-400/70">(Cert Verified)</span>
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                          <span>✓</span> Python <span className="text-[10px] text-emerald-400/70">(AI Test 10/10)</span>
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                          <span>✓</span> React <span className="text-[10px] text-emerald-400/70">(AI Test 9/10)</span>
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5">
                          <span>✓</span> MySQL <span className="text-[10px] text-blue-400/70">(Indexed)</span>
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-violet-400">★</span> Gemini Deep AI Insight:
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Production Ready
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        "Strong quantifiable impact detected in projects (e.g. 'Optimized API response by 45%'). Action verbs align with mid-level engineering roles. Recommended next: Add containerization (Docker/K8s) to target senior positions."
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-800"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-red-400 stroke-current"
                          strokeWidth="3"
                          strokeDasharray="45, 100"
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-3xl font-black text-white">45%</span>
                        <span className="block text-[10px] font-bold text-red-400 uppercase tracking-wider">ATS Score</span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-red-400">At Risk of Auto-Rejection</p>
                    <p className="text-[11px] text-slate-400">Missing critical core technologies</p>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detected Flaws</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-red-300 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                          <span>✕</span> Missing core cloud keywords (AWS, Docker, CI/CD).
                        </div>
                        <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                          <span>⚠</span> Vague project descriptions without quantifiable numerical metrics.
                        </div>
                        <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                          <span>⚠</span> Skills are not verified by test or certified proof.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. METRICS / SOCIAL PROOF BAR */}
      <section className="border-y border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                99.4%
              </p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Parsing Accuracy</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                50+
              </p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Tech Skills Indexed</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                &lt; 3 Sec
              </p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Instant Audit Speed</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-white bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                100%
              </p>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Document Verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES (BENTO GRID) */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Complete Career Stack</h2>
          <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Everything You Need To Get Hired
          </p>
          <p className="text-sm text-slate-400 font-normal">
            A comprehensive suite of intelligence tools designed to take you from resume draft to multiple interview offers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 space-y-4 hover:border-blue-500/50 hover:bg-slate-900/90 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Instant ATS Scoring Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects core technical competencies, keyword density, and checks whether your profile meets corporate ATS thresholds before you apply.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 space-y-4 hover:border-violet-500/50 hover:bg-slate-900/90 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Gemini Deep AI Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google Gemini evaluates your resume like a veteran hiring manager, highlighting weak bullet points, quantifying impact, and suggesting precise improvements.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 space-y-4 hover:border-emerald-500/50 hover:bg-slate-900/90 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Skill Verification & AI Tests</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Back your skills with proof. Upload certificates with smart validation or take interactive 10-question AI MCQ tests to display verified badges.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 space-y-4 hover:border-indigo-500/50 hover:bg-slate-900/90 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">AI Career Roadmap</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select any of your uploaded resumes and receive a structured blueprint outlining recommended certifications, technologies to learn, and projects to build.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 space-y-4 hover:border-pink-500/50 hover:bg-slate-900/90 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">AI Mock Interview Coach</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Practice real interview questions based on your resume profile credentials. Receive ratings out of 10, improvement tips, and recommended model answers.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 space-y-4 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">JD Match Compatibility</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Paste any target job description to see an instant match percentage, identifying missing keywords so you can tailor your resume before submitting.
            </p>
          </div>
        </div>
      </section>

      {/* 5. INTERACTIVE LIVE DEMO ROLE SIMULATOR */}
      <section id="live-demo" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 space-y-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Interactive Sandbox</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
                See How The Engine Evaluates Roles
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Select a target engineering domain below to see real-time skill indexing, ATS scoring, and interview simulations.
              </p>
            </div>

            {/* Role Tabs */}
            <div className="flex flex-wrap gap-2">
              {(["fullstack", "aiml", "devops", "data"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedDemoRole(role)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDemoRole === role
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-1 ring-blue-400"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {demoRolesData[role].title}
                </button>
              ))}
            </div>
          </div>

          {/* Active Role Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: ATS Score & Matched Skills */}
            <div className="space-y-6">
              <div className="rounded-2xl bg-slate-950/80 border border-slate-850 p-6 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simulated ATS Score</span>
                  <p className="text-3xl font-black text-white mt-0.5">{demoRolesData[selectedDemoRole].atsScore}%</p>
                  <span className="text-[10px] font-bold text-emerald-400">Excellent Market Fit</span>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 flex items-center justify-center font-bold text-emerald-400 text-sm">
                  {demoRolesData[selectedDemoRole].atsScore}%
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Indexed Keywords Found ({demoRolesData[selectedDemoRole].matched.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {demoRolesData[selectedDemoRole].matched.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Suggested Missing Skills ({demoRolesData[selectedDemoRole].missing.length})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {demoRolesData[selectedDemoRole].missing.map((skill) => (
                    <span key={skill} className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
                      + {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Career Roadmap & Mock Question */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl bg-slate-950/80 border border-slate-850 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Career Roadmap Milestones ({demoRolesData[selectedDemoRole].title})
                  </h4>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/60">
                  {demoRolesData[selectedDemoRole].roadmap}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950/80 border border-slate-850 p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Simulated AI Mock Interview Question
                  </h4>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 space-y-2">
                  <p className="text-xs font-bold text-white">
                    "{demoRolesData[selectedDemoRole].interviewQuestion}"
                  </p>
                  <p className="text-[11px] text-slate-400">
                    💡 Candidates who practice with our AI coach score 2.4x higher on real technical phone screens.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <button
                  onClick={() => navigate("/login")}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-xs font-bold text-white hover:from-blue-500 hover:to-violet-500 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Analyze My Resume for {demoRolesData[selectedDemoRole].title} →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Workflow</h2>
          <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How It Works in 3 Simple Steps
          </p>
          <p className="text-sm text-slate-400">
            From PDF upload to deep career insights in under 30 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative rounded-2xl bg-slate-900/40 border border-slate-800 p-8 space-y-4">
            <span className="text-5xl font-black text-slate-800 block">01</span>
            <h3 className="text-lg font-bold text-white">Upload Your Resume</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drop your PDF or DOCX resume. Our Smart Document Validator automatically screens the file to guarantee it has genuine resume sections.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-2xl bg-slate-900/40 border border-slate-800 p-8 space-y-4">
            <span className="text-5xl font-black text-slate-800 block">02</span>
            <h3 className="text-lg font-bold text-white">Instant ATS & Gemini Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get an instant ATS score rating, complete skill detection, and comprehensive Gemini AI feedback on formatting, tone, and quantified project impact.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-2xl bg-slate-900/40 border border-slate-800 p-8 space-y-4">
            <span className="text-5xl font-black text-slate-800 block">03</span>
            <h3 className="text-lg font-bold text-white">Verify Skills & Get Hired</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Take 10-question AI MCQ tests to earn verified badges, follow your personalized career roadmap, and prepare for interviews with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FAQ ACCORDION */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Questions & Answers</h2>
          <p className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-sm font-bold text-white">{faq.q}</span>
                  <span className={`text-blue-400 font-bold text-lg transition-transform ${isOpen ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-4 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. PRE-FOOTER CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-16 text-center space-y-6 shadow-2xl shadow-blue-500/20">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto">
            Stop guessing why recruiters aren't responding. Optimize your resume with Gemini AI and unlock your interview potential today.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-sm font-bold transition-all shadow-xl hover:scale-105 cursor-pointer"
            >
              Get Started Now — It's Free
            </button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">AI Resume Analyzer</span>
            <span>•</span>
            <span>Engineering Career Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-slate-300 transition-colors">Features</a>
            <a href="#live-demo" className="hover:text-slate-300 transition-colors">Demo</a>
            <a href="#faq" className="hover:text-slate-300 transition-colors">FAQ</a>
            <button onClick={() => navigate("/login")} className="hover:text-slate-300 transition-colors cursor-pointer">
              Login
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>All AI Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
