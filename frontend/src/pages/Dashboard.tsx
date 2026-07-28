import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { CITIES_DATA, type CityItem } from "../utils/citiesData";
import { COUNTRY_CODES, type CountryCodeItem } from "../utils/countryCodes";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

interface ResumeDetail {
  id: number;
  file_name: string;
  file_path: string;
  extracted_text: string | null;
  ats_score: number | null;
  uploaded_at: string;
}

interface DashboardStats {
  total_resumes: number;
  average_ats_score: number;
  highest_ats_score: number;
  latest_resume: {
    id: number;
    file_name: string;
    ats_score: number | null;
    uploaded_at: string;
  } | null;
}

interface HistoryItem {
  id: number;
  file_name: string;
  ats_score: number | null;
  uploaded_at: string;
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  dob?: string;
  gender?: string;
  city?: string;
  state?: string;
  country?: string;
  college?: string;
  degree?: string;
  branch?: string;
  current_semester?: string;
  graduation_year?: string;
  cgpa?: string;
  current_role?: string;
  about_me?: string;
  experience_years?: string;
  preferred_role?: string;
  preferred_work_mode?: string;
  skills_tech?: string;
  skills_programming?: string;
  skills_frameworks?: string;
  skills_databases?: string;
  skills_tools?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  leetcode_url?: string;
  hackerrank_url?: string;
}

function Dashboard() {
  const navigate = useNavigate();

  // Navigation state
  const [activeTab, setActiveTab] = useState<
    "overview" | "upload" | "history" | "job-match" | "chatbot" | "interview" | "roadmap" | "recruiter" | "profile"
  >("overview");

  // Data states
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeDetail | null>(null);

  // Tools & Analysis states
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [jobDescription, setJobDescription] = useState<string>("");
  const [jobMatchResult, setJobMatchResult] = useState<string>("");
  const [matchLoading, setMatchLoading] = useState<boolean>(false);

  // AI Chatbot states
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "advisor"; text: string }[]>([
    {
      sender: "advisor",
      text: "Hello! I am your AI Career Coach. How can I help you with your career roadmaps, interview preparation, or resume details today?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // AI Mock Interview states
  const [interviewQuestion, setInterviewQuestion] = useState("Tell me about yourself and your background.");
  const [customQuestion, setCustomQuestion] = useState("");
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);

  // AI Career Roadmap states
  const [careerRoadmap, setCareerRoadmap] = useState("");
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  // Recruiter Console states
  const [recruiterResumes, setRecruiterResumes] = useState<any[]>([]);
  const [recruiterLoading, setRecruiterLoading] = useState(false);

  // Profile & Settings states
  const [profileForm, setProfileForm] = useState<any>({});
  const [profileStats, setProfileStats] = useState<{
    current_resume_name: string;
    resume_upload_date: string;
    latest_ats_score: number;
    latest_ai_score: number;
    total_resume_uploads: number;
  } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSubTab, setProfileSubTab] = useState<"personal" | "education" | "professional" | "skills" | "social" | "resume" | "security">("personal");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Global app feedback
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch essential user & metrics data
  const fetchData = async () => {
    try {
      setErrorMsg("");
      const userRes = await api.get("/users/me");
      setUser(userRes.data);
      setProfileForm(userRes.data);

      try {
        const [statsRes, historyRes, profileStatsRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/history/resumes"),
          api.get("/users/me/resume-stats"),
        ]);
        setStats(statsRes.data);
        setHistory(historyRes.data.history || []);
        setProfileStats(profileStatsRes.data);
      } catch (statsErr) {
        console.error("Error fetching stats/history:", statsErr);
      }

      if (userRes.data.role === "admin" || userRes.data.role === "recruiter") {
        try {
          setRecruiterLoading(true);
          const recruiterRes = await api.get("/resumes/admin/all");
          setRecruiterResumes(recruiterRes.data || []);
        } catch (recErr) {
          console.error("Error fetching recruiter resumes:", recErr);
        } finally {
          setRecruiterLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      if (err.response?.status === 401 || err.response?.status === 404 || err.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setErrorMsg("Failed to synchronize data. Verify if the backend server is running.");
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [navigate]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Profile Form Handlers
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev: any) => ({ ...prev, [name]: value }));
  };

  // City Autocomplete States & Handlers
  const [citySuggestions, setCitySuggestions] = useState<CityItem[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const handleCityChange = (val: string) => {
    setProfileForm((prev: any) => {
      const updated = { ...prev, city: val };
      const exactMatch = CITIES_DATA.find(
        (c) => c.city.toLowerCase() === val.trim().toLowerCase()
      );
      if (exactMatch) {
        updated.state = exactMatch.state;
        updated.country = exactMatch.country;
      }
      return updated;
    });

    if (val.trim().length >= 1) {
      const matches = CITIES_DATA.filter((c) =>
        c.city.toLowerCase().includes(val.trim().toLowerCase())
      ).slice(0, 8);
      setCitySuggestions(matches);
      setShowCityDropdown(matches.length > 0);
    } else {
      setCitySuggestions([]);
      setShowCityDropdown(false);
    }
  };

  const handleSelectCitySuggestion = (item: CityItem) => {
    setProfileForm((prev: any) => ({
      ...prev,
      city: item.city,
      state: item.state,
      country: item.country,
    }));
    setShowCityDropdown(false);
  };

  // Country Code States & Handlers
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [codeSearchQuery, setCodeSearchQuery] = useState("");

  useEffect(() => {
    if (profileForm.phone) {
      const match = profileForm.phone.trim().match(/^(\+\d+)/);
      if (match && match[1]) {
        const found = COUNTRY_CODES.find((c) => c.code === match[1]);
        if (found) {
          setCountryCode(found.code);
        } else {
          setCountryCode(match[1]);
        }
      }
    }
  }, [profileForm.phone]);

  const getMaxDigitsForCurrentCountry = () => {
    const found = COUNTRY_CODES.find((c) => c.code === countryCode);
    return found ? found.maxDigits : 10;
  };

  const getPhoneNumberOnly = () => {
    if (!profileForm.phone) return "";
    let str = profileForm.phone.trim();
    if (str.startsWith(countryCode)) {
      str = str.slice(countryCode.length);
    } else if (str.startsWith("+")) {
      str = str.replace(/^\+\d+\s*/, "");
    }
    return str.replace(/\D/g, "");
  };

  const handlePhoneNumberChange = (num: string) => {
    const maxLen = getMaxDigitsForCurrentCountry();
    const cleanDigits = num.replace(/\D/g, "").slice(0, maxLen);
    setProfileForm((prev: any) => ({
      ...prev,
      phone: cleanDigits ? `${countryCode} ${cleanDigits}` : "",
    }));
  };

  const handleSelectCountryCode = (item: CountryCodeItem) => {
    setCountryCode(item.code);
    const currentDigits = getPhoneNumberOnly().slice(0, item.maxDigits);
    setProfileForm((prev: any) => ({
      ...prev,
      phone: currentDigits ? `${item.code} ${currentDigits}` : "",
    }));
    setShowCodeDropdown(false);
  };

  // Social URL Validation Helper
  const validateSocialUrl = (url?: string, platform?: "github" | "linkedin" | "leetcode" | "hackerrank" | "portfolio"): string | null => {
    if (!url || !url.trim()) return null;
    const lower = url.trim().toLowerCase();

    switch (platform) {
      case "github":
        if (!lower.includes("github.com")) {
          return "Invalid GitHub URL! Must contain 'github.com'";
        }
        break;
      case "linkedin":
        if (!lower.includes("linkedin.com")) {
          return "Invalid LinkedIn URL! Must contain 'linkedin.com'";
        }
        break;
      case "leetcode":
        if (!lower.includes("leetcode.com")) {
          return "Invalid LeetCode URL! Must contain 'leetcode.com'";
        }
        break;
      case "hackerrank":
        if (!lower.includes("hackerrank.com")) {
          return "Invalid HackerRank URL! Must contain 'hackerrank.com'";
        }
        break;
      case "portfolio":
        if (!lower.includes(".")) {
          return "Invalid Portfolio URL! Must be a valid web domain";
        }
        break;
    }
    return null;
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const socialErr =
      validateSocialUrl(profileForm.github_url, "github") ||
      validateSocialUrl(profileForm.linkedin_url, "linkedin") ||
      validateSocialUrl(profileForm.leetcode_url, "leetcode") ||
      validateSocialUrl(profileForm.hackerrank_url, "hackerrank") ||
      validateSocialUrl(profileForm.portfolio_url, "portfolio");

    if (socialErr) {
      setErrorMsg(socialErr);
      return;
    }

    try {
      setProfileSaving(true);
      setProfileSuccessMsg("");
      setErrorMsg("");
      const res = await api.put("/users/me", profileForm);
      setUser(res.data);
      setProfileForm(res.data);
      setProfileSuccessMsg("Profile information saved successfully! ✨");
      setTimeout(() => setProfileSuccessMsg(""), 4000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      let detailMsg = err.response?.data?.detail;
      setErrorMsg(detailMsg || "Failed to save profile changes.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: "error", text: "New password and confirmation do not match." });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters long." });
      return;
    }
    try {
      setPasswordSaving(true);
      setPasswordMsg(null);
      await api.put("/users/change-password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordMsg({ type: "success", text: "Password changed successfully! 🔑" });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: any) {
      console.error("Error changing password:", err);
      let detailMsg = err.response?.data?.detail;
      setPasswordMsg({ type: "error", text: detailMsg || "Failed to change password." });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Inspect detailed resume from history
  const loadResumeDetails = async (resumeId: number) => {
    try {
      setUploading(true);
      setErrorMsg("");
      const res = await api.get(`/resumes/${resumeId}`);
      setSelectedResume(res.data);
      setAiAnalysis("");
      setJobMatchResult("");
      setActiveTab("upload"); // switch to analysis view
    } catch (err: any) {
      console.error("Error loading resume:", err);
      const foundInHistory = history.find((item: any) => item.id === resumeId) || recruiterResumes.find((c: any) => c.id === resumeId);
      if (foundInHistory) {
        setSelectedResume(foundInHistory);
        setAiAnalysis("");
        setJobMatchResult("");
        setActiveTab("upload");
      } else {
        let detailMsg = err.response?.data?.detail;
        setErrorMsg(detailMsg || "Failed to load details for this resume.");
      }
    } finally {
      setUploading(false);
    }
  };

  // Delete resume
  const handleDeleteResume = async (resumeId: number) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    try {
      await api.delete(`/resumes/${resumeId}`);
      setHistory((prev) => prev.filter((item) => item.id !== resumeId));
      setRecruiterResumes((prev) => prev.filter((item) => item.id !== resumeId));
      if (selectedResume?.id === resumeId) {
        setSelectedResume(null);
      }
      fetchData();
    } catch (err: any) {
      console.error("Error deleting resume:", err);
      let detailMsg = err.response?.data?.detail;
      setErrorMsg(detailMsg || "Failed to delete resume.");
    }
  };

  // Send message to chatbot advisor
  const sendChatMessage = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!chatInput.trim() || chatLoading) return;
 
     const userMsg = chatInput.trim();
     const updatedHistory: { sender: "user" | "advisor"; text: string }[] = [
       ...chatHistory,
       { sender: "user", text: userMsg },
     ];
     setChatHistory(updatedHistory);
     setChatInput("");
     setChatLoading(true);

    try {
      const res = await api.post("/ai/chatbot", {
        chat_history: updatedHistory.map(h => ({ sender: h.sender, text: h.text })),
        message: userMsg,
        resume_text: selectedResume?.extracted_text || "",
      });

      if (res.data.success) {
        setChatHistory((prev) => [
          ...prev,
          { sender: "advisor", text: res.data.response },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { sender: "advisor", text: "I'm having trouble connecting right now. Please try again." },
        ]);
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      setChatHistory((prev) => [
        ...prev,
        { sender: "advisor", text: "Error contacting advisor. Verify that backend is running and Gemini API key is configured." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Submit interview answer
  const submitInterview = async () => {
    const questionText = interviewQuestion === "custom" ? customQuestion : interviewQuestion;
    if (!questionText.trim() || !interviewAnswer.trim() || interviewLoading) return;

    setInterviewLoading(true);
    setInterviewFeedback("");
    try {
      const res = await api.post("/ai/interview/feedback", {
        question: questionText,
        answer: interviewAnswer,
        resume_text: selectedResume?.extracted_text || "",
      });

      if (res.data.success) {
        setInterviewFeedback(res.data.feedback);
      } else {
        setInterviewFeedback("Failed to evaluate answer.");
      }
    } catch (err) {
      console.error("Interview feedback error:", err);
      setInterviewFeedback("Error generating feedback. Make sure backend is running with Gemini API key.");
    } finally {
      setInterviewLoading(false);
    }
  };

  // Generate career roadmap
  const generateRoadmap = async () => {
    const resumeText = selectedResume?.extracted_text || "";
    if (!resumeText) return;

    setRoadmapLoading(true);
    setCareerRoadmap("");
    try {
      const res = await api.post("/ai/career-roadmap", {
        resume_text: resumeText,
      });

      if (res.data.success) {
        setCareerRoadmap(res.data.roadmap);
      } else {
        setCareerRoadmap("Unable to generate roadmap at this time.");
      }
    } catch (err) {
      console.error("Roadmap error:", err);
      setCareerRoadmap("Error generating career roadmap. Make sure backend is running with Gemini API key.");
    } finally {
      setRoadmapLoading(false);
    }
  };

  // Export report download
  const handleExportReport = async (resumeId: number, fileName: string) => {
    try {
      const res = await api.get(`/resumes/${resumeId}/export`, {
        responseType: "text",
      });

      const blob = new Blob([res.data], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Resume_Evaluation_${fileName.replace(/\.[^/.]+$/, "")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      setErrorMsg("Failed to export resume evaluation report.");
    }
  };

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setUploadError("");
    setUploadSuccess(false);
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!validTypes.includes(selectedFile.type) && fileExt !== "pdf" && fileExt !== "docx") {
      setUploadError("Only PDF and DOCX files are allowed.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  // File Upload Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/resumes/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedResume(response.data);
      setUploadSuccess(true);
      setFile(null);
      setAiAnalysis("");
      setJobMatchResult("");
      
      // Update statistics and history list
      fetchData();
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(
        err.response?.data?.detail || "Upload failed. Please ensure file matches constraints."
      );
    } finally {
      setUploading(false);
    }
  };

  // Gemini AI Analysis
  const runGeminiAnalysis = async () => {
    if (!selectedResume || !selectedResume.extracted_text) return;

    setAiLoading(true);
    setAiAnalysis("");
    try {
      const res = await api.post("/ai/analyze", {
        resume_text: selectedResume.extracted_text,
      });
      if (res.data.success) {
        setAiAnalysis(res.data.analysis);
      } else {
        setAiAnalysis("Unable to retrieve AI analysis. Please try again.");
      }
    } catch (err: any) {
      console.error("Gemini analysis error:", err);
      setAiAnalysis("Error generating AI analysis. Ensure GEMINI_API_KEY is configured in backend env.");
    } finally {
      setAiLoading(false);
    }
  };

  // Resume vs Job Description Matching
  const runJobMatching = async () => {
    const resumeText = selectedResume?.extracted_text || (history.length > 0 ? "Select a resume to compare" : "");
    if (!resumeText || !jobDescription.trim()) return;

    setMatchLoading(true);
    setJobMatchResult("");
    try {
      const res = await api.post("/job/match", {
        resume_text: resumeText,
        job_description: jobDescription,
      });
      if (res.data.success) {
        setJobMatchResult(res.data.analysis);
      } else {
        setJobMatchResult("Unable to calculate match metrics.");
      }
    } catch (err: any) {
      console.error("Job matching error:", err);
      setJobMatchResult("Error matching job description. Ensure GEMINI_API_KEY is configured in backend.");
    } finally {
      setMatchLoading(false);
    }
  };

  // Extract suggestions and skills list from local parsing
  const getDetectedSkillsAndSuggestions = (text: string) => {
    const lower = text.toLowerCase();
    
    // Quick mock skill check match similar to backend database for visual tags
    const presetSkills = [
      "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "html", "css", 
      "react", "next.js", "angular", "vue", "fastapi", "django", "node.js", "express", 
      "mysql", "postgresql", "mongodb", "sqlite", "git", "docker", "kubernetes", "aws", "azure", 
      "linux", "machine learning", "deep learning", "tensorflow", "pytorch", "nlp", "gemini"
    ];
    
    const detected = presetSkills.filter(skill => {
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])${escapedSkill}(?=$|[^a-zA-Z0-9_])`, "i");
      return regex.test(lower);
    });

    const suggestions: string[] = [];
    if (detected.length < 8) suggestions.push("Add more core technical skills to improve indexing.");
    if (!detected.includes("github") && !lower.includes("github.com")) suggestions.push("Provide links to a portfolio website or GitHub profile.");
    if (!detected.includes("docker")) suggestions.push("Adding Docker containerization demonstrates devops proficiency.");
    if (!detected.includes("aws") && !detected.includes("azure")) suggestions.push("Mention cloud operations (AWS/Azure) to raise the ATS ranking.");
    if (text.length < 500) suggestions.push("Your resume seems short. Elaborate on work experiences and project scopes.");

    return { skills: detected, suggestions };
  };

  const currentSkillsAndSuggestions = selectedResume?.extracted_text 
    ? getDetectedSkillsAndSuggestions(selectedResume.extracted_text)
    : { skills: [], suggestions: [] };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Decorative gradient glow elements */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none"></div>

      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-900/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-800 p-6 flex flex-col justify-between z-10">
        <div>
          {/* Logo brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base tracking-tight leading-tight">Resume AI</h2>
              <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Analyzer Workspace</span>
            </div>
          </div>

          {/* Navigation link actions */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Overview
            </button>

            <button
              onClick={() => setActiveTab("upload")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "upload"
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
              </svg>
              Upload & Scan
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              History Logs
            </button>

            <button
              onClick={() => setActiveTab("job-match")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "job-match"
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              Job Matcher
            </button>

            <button
              onClick={() => setActiveTab("chatbot")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "chatbot"
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
              </svg>
              AI Chatbot
            </button>

            <button
              onClick={() => setActiveTab("interview")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "interview"
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.9c2.785 0 5.5-.233 8.15-.666a60.443 60.443 0 0 0-.49-6.347m-15.4 0A48.667 48.667 0 0 0 1.5 10.143L12 3.75l10.5 6.393a48.667 48.667 0 0 0-3.66 3.65m-14.58 0C3.903 12.35 4.59 10.3 5.26 10.147m13.48 0c.67.153 1.356 2.203 1.58 3.65m-15.06 0a49.08 49.08 0 0 1 15.06 0M12 14.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
              </svg>
              Mock Interview
            </button>

            <button
              onClick={() => setActiveTab("roadmap")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "roadmap"
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8m-3-12.75v12.75M3 12h18M6.75 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Career Roadmap
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "profile"
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              Profile & Settings
            </button>

            {(user?.role === "admin" || user?.role === "recruiter") && (
              <button
                onClick={() => setActiveTab("recruiter")}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === "recruiter"
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
                Recruiter Console
              </button>
            )}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 mb-4 p-2.5 rounded-xl cursor-pointer transition-all border ${
              activeTab === "profile"
                ? "bg-slate-800/80 border-blue-500/40 shadow-lg shadow-blue-500/10"
                : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700"
            }`}
            title="Click to view & edit Profile"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 border border-blue-400/30 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/10">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-white truncate flex items-center justify-between">
                <span>{user?.full_name || "Profile Loading..."}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email || "syncing..."}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-red-500/15"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <main className="flex-1 p-6 md:p-10 z-10 overflow-y-auto max-h-screen">
        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-6 flex items-start gap-3.5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <div>
              <h4 className="font-bold">Database Synchronicity Alert</h4>
              <p className="text-xs text-slate-400 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header section */}
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                Workspace Overview
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Track your resume quality benchmarks, parser stats, and upload histories.
              </p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Metric 1 */}
              <div className="rounded-2xl bg-slate-900/50 backdrop-blur-md p-6 border border-slate-800 hover:border-slate-700/80 transition-all flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resumes Uploaded</span>
                  <h3 className="text-4xl font-black mt-2 text-white">{stats?.total_resumes ?? 0}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Files currently indexed</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="rounded-2xl bg-slate-900/50 backdrop-blur-md p-6 border border-slate-800 hover:border-slate-700/80 transition-all flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average ATS Score</span>
                  <h3 className="text-4xl font-black mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                    {stats?.average_ats_score ?? 0}%
                  </h3>
                  <div className="w-24 bg-slate-850 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${stats?.average_ats_score ?? 0}%` }}></div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                  </svg>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="rounded-2xl bg-slate-900/50 backdrop-blur-md p-6 border border-slate-800 hover:border-slate-700/80 transition-all flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Highest ATS Score</span>
                  <h3 className="text-4xl font-black mt-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                    {stats?.highest_ats_score ?? 0}%
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Best matched profile</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a2.25 2.25 0 0 1-2.25-2.25v-1.5a2.25 2.25 0 0 1 2.25-2.25m-5.007 0a2.25 2.25 0 0 0-2.25 2.25v1.5a2.25 2.25 0 0 0 2.25 2.25m4.363-8.624a9.78 9.78 0 0 0-4.726 0 2.25 2.25 0 0 0-1.564 1.95L8.25 12h7.5l-.223-1.674a2.25 2.25 0 0 0-1.564-1.95Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Entry card */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Scan New Resume</h3>
                  <p className="text-slate-400 text-xs leading-relaxed mb-6">
                    Upload your profile in PDF or DOCX format. Our engine automatically parses metadata, checks skill keyword occurrences, and calculates real-time ATS compliance scores.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/10"
                >
                  Go to Scanner Workspace
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>

              {/* Latest analysis profile */}
              <div className="rounded-2xl bg-slate-900/35 border border-slate-800/80 p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Latest Scan</h3>
                  {stats?.latest_resume ? (
                    <div className="bg-slate-950/50 rounded-xl p-4.5 border border-slate-800/60 flex items-center justify-between">
                      <div className="truncate mr-4">
                        <p className="text-sm font-semibold text-white truncate">{stats.latest_resume.file_name}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Uploaded {new Date(stats.latest_resume.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                          {stats.latest_resume.ats_score}% ATS
                        </span>
                        <button
                          onClick={() => loadResumeDetails(stats.latest_resume!.id)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic mt-2">No resumes uploaded yet.</p>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab("history")}
                  className="mt-6 text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 self-start transition-all"
                >
                  Browse history records
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. UPLOAD & SCAN TAB */}
        {activeTab === "upload" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Scanner Workspace
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Drag or select a file to calculate keywords matching and request Gemini detailed audits.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column: Upload panel */}
              <div className="xl:col-span-1 space-y-6">
                <div className="rounded-2xl bg-slate-900/60 backdrop-blur-md p-6 border border-slate-800">
                  <h3 className="text-lg font-bold text-white mb-4">Upload File</h3>

                  <form onSubmit={handleUploadSubmit} className="space-y-4">
                    {/* Drag Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
                        isDragOver
                          ? "border-blue-500 bg-blue-500/5"
                          : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
                      }`}
                    >
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.docx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                      />

                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                        </svg>
                      </div>

                      <p className="text-xs font-semibold text-slate-300 text-center">
                        {file ? file.name : "Drag & Drop Resume"}
                      </p>
                      <p className="text-[10px] text-slate-500 text-center mt-1">
                        PDF or DOCX format (Max 5MB)
                      </p>
                    </div>

                    {uploadError && (
                      <p className="text-xs text-red-400 font-semibold">{uploadError}</p>
                    )}
                    {uploadSuccess && (
                      <p className="text-xs text-emerald-400 font-semibold">✅ Upload and parsing complete!</p>
                    )}

                    <div className="flex gap-3">
                      {file && (
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="flex-1 rounded-lg border border-slate-850 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-all"
                        >
                          Clear
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={!file || uploading}
                        className="flex-[2] rounded-lg bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
                      >
                        {uploading ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin"></span>
                            Analyzing...
                          </>
                        ) : (
                          "Start Scan"
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Switcher/Context display if a resume is already selected */}
                {selectedResume && (
                  <div className="rounded-2xl bg-slate-900/35 border border-slate-800/80 p-5 space-y-4.5">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Resume Profile</h4>
                      <p className="text-sm font-bold text-white mt-1 truncate">{selectedResume.file_name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Scanned {new Date(selectedResume.uploaded_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={runGeminiAnalysis}
                          disabled={aiLoading}
                          className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 py-2 text-xs font-bold text-white hover:from-blue-500 hover:to-violet-500 transition-all flex items-center justify-center gap-1 shadow-md shadow-blue-500/5 disabled:opacity-55"
                        >
                          {aiLoading ? "Thinking..." : "Deep AI Review"}
                        </button>
                        <button
                          onClick={() => {
                            setJobDescription("");
                            setJobMatchResult("");
                            setActiveTab("job-match");
                          }}
                          className="flex-1 rounded-lg bg-slate-800 border border-slate-800 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-1"
                        >
                          Match Jobs
                        </button>
                      </div>
                      <button
                        onClick={() => handleExportReport(selectedResume.id, selectedResume.file_name)}
                        className="w-full rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 py-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-all flex items-center justify-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download Report
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Scan findings */}
              <div className="xl:col-span-2 space-y-8">
                {selectedResume ? (
                  <div className="space-y-8">
                    {/* Score Summary Banner */}
                    <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col md:flex-row items-center gap-6">
                      {/* Circle Score Gauge */}
                      <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-800"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="transparent"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-blue-500 transition-all duration-1000"
                            strokeDasharray={`${selectedResume.ats_score ?? 0}, 100`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-white">{selectedResume.ats_score ?? 0}%</span>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">ATS Score</span>
                        </div>
                      </div>

                      {/* Summary Metrics */}
                      <div className="flex-1 space-y-3.5 text-center md:text-left">
                        <div>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 font-semibold uppercase">Scan Results</span>
                          <h2 className="text-2xl font-bold text-white mt-1.5">{selectedResume.file_name}</h2>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                          ATS Score indicates alignment with core industry technologies. Review detected skills and suggestions below to raise compliance.
                        </p>
                      </div>
                    </div>

                    {/* Tabs / Sub-Sections of active scan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Detected Skills */}
                      <div className="rounded-2xl bg-slate-900/40 border border-slate-850 p-6">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                          </svg>
                          Identified Skills ({currentSkillsAndSuggestions.skills.length})
                        </h4>
                        {currentSkillsAndSuggestions.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {currentSkillsAndSuggestions.skills.map((skill) => (
                              <span key={skill} className="text-xs px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize font-medium">
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No indexed skills found in the parsed text.</p>
                        )}
                      </div>

                      {/* Dynamic Suggestions */}
                      <div className="rounded-2xl bg-slate-900/40 border border-slate-850 p-6">
                        <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 5.25h.008v-.008H12v.008ZM12 13V9.75m0 3.25h.008v-.008H12v.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          ATS Suggestions ({currentSkillsAndSuggestions.suggestions.length})
                        </h4>
                        {currentSkillsAndSuggestions.suggestions.length > 0 ? (
                          <ul className="space-y-2.5">
                            {currentSkillsAndSuggestions.suggestions.map((sug, idx) => (
                              <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70 mt-1.5 flex-shrink-0"></span>
                                {sug}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            ✨ Excellent parser rating! No suggestions needed.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Gemini AI deep review output */}
                    <div className="rounded-2xl bg-slate-900/40 border border-slate-850 p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-violet-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l.813-5.096a5.45 5.45 0 0 1-1.087-1.085L3.627 12h5.096a5.45 5.45 0 0 1 1.085-1.087L12 3.627l1.087 5.096a5.45 5.45 0 0 1 1.085 1.087H19.25c.622 0 1.125.503 1.125 1.125V12h-5.096a5.45 5.45 0 0 1-1.087 1.085L15 21l-.813-5.096a5.45 5.45 0 0 1-1.085-1.087H9.813Z" />
                          </svg>
                          Gemini Deep Audit Insight
                        </h4>
                        {!aiAnalysis && !aiLoading && (
                          <button
                            onClick={runGeminiAnalysis}
                            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all flex items-center gap-1"
                          >
                            Generate Audit
                          </button>
                        )}
                      </div>

                      {aiLoading && (
                        <div className="flex flex-col items-center justify-center py-10 space-y-3">
                          <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
                          <span className="text-xs text-slate-500 font-medium">Gemini model analyzing profile context...</span>
                        </div>
                      )}

                      {aiAnalysis && (
                        <div className="bg-slate-950/70 rounded-xl p-5 border border-slate-800/80 prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                          {aiAnalysis}
                        </div>
                      )}

                      {!aiAnalysis && !aiLoading && (
                        <p className="text-xs text-slate-500 italic text-center py-6">
                          Click "Generate Audit" to perform full analysis using Gemini AI.
                        </p>
                      )}
                    </div>

                    {/* Resume extracted text preview */}
                    <div className="rounded-2xl bg-slate-900/40 border border-slate-850 p-6">
                      <h4 className="text-sm font-bold text-white mb-4">Parsed Text Output</h4>
                      <div className="bg-slate-950/50 rounded-xl p-4.5 max-h-60 overflow-y-auto border border-slate-800/60 font-mono text-[10px] text-slate-400 whitespace-pre-line leading-relaxed">
                        {selectedResume.extracted_text || "No text could be extracted."}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-900/10 border border-slate-800/50 border-dashed p-20 flex flex-col items-center justify-center text-slate-500 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900/60 border border-slate-850 flex items-center justify-center text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 2.24c-.09.09-.195.172-.311.246a4.707 4.707 0 0 1-1.37.536M4.5 18v.75A2.25 2.25 0 0 0 6.75 21h10.5a2.25 2.25 0 0 0 2.25-2.25V18m-13.5-3.75h13.5m-13.5-3.75h13.5m-13.5-3.75h13.5" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-sm text-slate-400">No active profile loaded</p>
                      <p className="text-xs text-slate-500 mt-1">Upload a resume file, or inspect a historical record to begin.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. HISTORY LOGS TAB */}
        {activeTab === "history" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                History Logs
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                View summaries of previously parsed profiles and load details back to work area.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              {history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-950/40">
                        <th className="px-6 py-4.5">File Name</th>
                        <th className="px-6 py-4.5">ATS Score</th>
                        <th className="px-6 py-4.5">Scan Date</th>
                        <th className="px-6 py-4.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 text-xs font-medium">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/35 transition-all">
                          <td className="px-6 py-4 truncate max-w-md font-semibold text-white">
                            {item.file_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold border ${
                              (item.ats_score ?? 0) >= 70
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : (item.ats_score ?? 0) >= 40
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              {item.ats_score ?? 0}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(item.uploaded_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => loadResumeDetails(item.id)}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-white transition-all shadow-md shadow-blue-500/5 inline-flex items-center gap-1"
                              >
                                Inspect Profile
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteResume(item.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold transition-all inline-flex items-center gap-1"
                                title="Delete Resume"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold italic">No scan history recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. JOB MATCHER TAB */}
        {activeTab === "job-match" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Job Matcher
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Compare your active resume index against any JD description to compute compatibility score.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Input fields */}
              <div className="space-y-6">
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Selected Resume
                    </label>
                    {selectedResume ? (
                      <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate mr-3">{selectedResume.file_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                          {selectedResume.ats_score}% ATS
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/15 text-xs text-red-400 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                        <span>No resume selected. Go to <b>Upload & Scan</b> to upload or select a profile first.</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Paste Job Description
                    </label>
                    <textarea
                      rows={10}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the target job description (responsibilities, technical requirements, skills list) here..."
                      className="w-full bg-slate-950/60 rounded-xl border border-slate-800 p-4 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans leading-relaxed"
                      required
                    />
                  </div>

                  <button
                    onClick={runJobMatching}
                    disabled={!selectedResume || !jobDescription.trim() || matchLoading}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 font-bold text-xs text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
                  >
                    {matchLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin"></span>
                        Calculating compatibility...
                      </>
                    ) : (
                      "Calculate Match Compliance"
                    )}
                  </button>
                </div>
              </div>

              {/* Comparison Output display */}
              <div>
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 min-h-[400px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Alignment Scoring Analysis
                    </h3>

                    {matchLoading && (
                      <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <span className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></span>
                        <span className="text-xs text-slate-500 font-medium">Gemini model calculating overlap indexes...</span>
                      </div>
                    )}

                    {jobMatchResult && !matchLoading && (
                      <div className="bg-slate-950/70 border border-slate-850/80 rounded-xl p-5 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono max-h-[500px] overflow-y-auto">
                        {jobMatchResult}
                      </div>
                    )}

                    {!jobMatchResult && !matchLoading && (
                      <p className="text-xs text-slate-500 italic text-center py-20">
                        Provide a job description and submit compliance check to see alignment findings.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. AI CHATBOT TAB */}
        {activeTab === "chatbot" && (
          <div className="space-y-8 animate-fade-in flex flex-col h-[calc(100vh-120px)]">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
                AI Career Coach
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">Gemini Powered</span>
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Discuss career strategies, preparation tips, and resume suggestions tailored to your profile.
              </p>
            </div>

            {selectedResume ? (
              <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.852l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <span>Using active resume <b>{selectedResume.file_name}</b> as coaching context.</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span>No active resume selected. Upload a resume first to receive personalized recommendations based on your skills.</span>
              </div>
            )}

            <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[450px]">
                {chatHistory.map((chat, idx) => (
                  <div key={idx} className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                      chat.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/5"
                        : "bg-slate-950/70 text-slate-300 border border-slate-800 rounded-bl-none"
                    }`}>
                      {chat.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={sendChatMessage} className="p-4 border-t border-slate-800 bg-slate-950/40 flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your career advisor about project ideas, certifications, placement prep..."
                  className="flex-1 bg-slate-950 rounded-xl border border-slate-850 px-4 py-3 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500 transition-all"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-xs font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-lg shadow-blue-500/10"
                >
                  Send
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 6. MOCK INTERVIEW TAB */}
        {activeTab === "interview" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Mock Interview Coach
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Select a topic, type your answer, and receive rating evaluation feedback.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Question list & submission */}
              <div className="space-y-6">
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4.5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Select Question Topic
                    </label>
                    <select
                      value={interviewQuestion}
                      onChange={(e) => setInterviewQuestion(e.target.value)}
                      className="w-full bg-slate-950/60 rounded-xl border border-slate-800 p-3 text-xs text-white outline-none focus:border-blue-500 transition-all font-sans"
                    >
                      <option value="Tell me about yourself and your background.">Introduction: Tell me about yourself</option>
                      <option value="Describe a challenging technical project you worked on and how you resolved a blocker.">Project: Challenging tech project & blockers</option>
                      <option value="How do you keep up with new tech stacks and choose what to learn next?">Growth: Staying up to date with new tech</option>
                      <option value="Why do you want to join our company as a software developer?">Culture: Why join us?</option>
                      <option value="custom">Custom Question (Enter below)</option>
                    </select>
                  </div>

                  {interviewQuestion === "custom" && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Your Custom Question
                      </label>
                      <input
                        type="text"
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="e.g., Explain the difference between process and thread."
                        className="w-full bg-slate-950/60 rounded-xl border border-slate-800 p-3.5 text-xs text-white placeholder-slate-650 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Your Answer
                    </label>
                    <textarea
                      rows={8}
                      value={interviewAnswer}
                      onChange={(e) => setInterviewAnswer(e.target.value)}
                      placeholder="Type your structured answer here (Try using STAR methodology: Situation, Task, Action, Result)..."
                      className="w-full bg-slate-950/60 rounded-xl border border-slate-800 p-4 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 transition-all font-sans leading-relaxed"
                      required
                    />
                  </div>

                  <button
                    onClick={submitInterview}
                    disabled={!interviewAnswer.trim() || (interviewQuestion === "custom" && !customQuestion.trim()) || interviewLoading}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 font-bold text-xs text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10"
                  >
                    {interviewLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin"></span>
                        Evaluating response...
                      </>
                    ) : (
                      "Submit Response for Audit"
                    )}
                  </button>
                </div>
              </div>

              {/* Feedback outputs */}
              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 min-h-[400px] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-violet-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 5.25h.008v-.008H12v.008ZM12 13V9.75m0 3.25h.008v-.008H12v.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Evaluation Feedback
                  </h3>

                  {interviewLoading && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                      <span className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin"></span>
                      <span className="text-xs text-slate-500 font-medium">Interviewer compiling scoring matrix...</span>
                    </div>
                  )}

                  {interviewFeedback && !interviewLoading && (
                    <div className="bg-slate-950/70 border border-slate-850/80 rounded-xl p-5 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[450px] overflow-y-auto font-sans">
                      {interviewFeedback}
                    </div>
                  )}

                  {!interviewFeedback && !interviewLoading && (
                    <p className="text-xs text-slate-500 italic text-center py-20">
                      Submit your interview answer on the left to see ratings, strengths, recommendations, and model answers.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. CAREER ROADMAP TAB */}
        {activeTab === "roadmap" && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                AI Career Roadmap
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Obtain a personalized step-by-step career path outline based on your scanned profile credentials.
              </p>
            </div>

            {selectedResume ? (
              <div className="space-y-6">
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="truncate">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scanned Profile</h4>
                    <p className="text-sm font-bold text-white mt-1 truncate">{selectedResume.file_name}</p>
                  </div>
                  <button
                    onClick={generateRoadmap}
                    disabled={roadmapLoading}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-xs font-bold text-white hover:from-blue-500 hover:to-violet-500 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 disabled:opacity-50"
                  >
                    {roadmapLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 rounded-full border border-white/30 border-t-white animate-spin"></span>
                        Mapping milestones...
                      </>
                    ) : (
                      "Generate Step-by-Step Path"
                    )}
                  </button>
                </div>

                {roadmapLoading && (
                  <div className="rounded-2xl bg-slate-900/40 border border-slate-850 p-20 flex flex-col items-center justify-center space-y-4">
                    <span className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></span>
                    <span className="text-xs text-slate-500 font-semibold">Gemini API is drafting your educational/industry career milestones...</span>
                  </div>
                )}

                {careerRoadmap && !roadmapLoading && (
                  <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 space-y-6">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25H5.625A2.25 2.25 0 0 1 3.375 18V6.125c0-.621.504-1.125 1.125-1.125H9.75M8.25 21h8.25" />
                      </svg>
                      Career Pathway Blueprint
                    </h3>
                    <div className="bg-slate-950/70 border border-slate-850/80 rounded-xl p-6 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                      {careerRoadmap}
                    </div>
                  </div>
                )}

                {!careerRoadmap && !roadmapLoading && (
                  <div className="rounded-2xl bg-slate-900/10 border border-slate-800/40 border-dashed p-20 flex flex-col items-center justify-center text-slate-500 text-center">
                    <p className="font-semibold text-sm">Ready to Map Career Pathway</p>
                    <p className="text-xs mt-1 text-slate-650">Click "Generate Step-by-Step Path" above to construct your career roadmap.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/10 border border-slate-800/50 border-dashed p-20 flex flex-col items-center justify-center text-slate-500 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <p className="font-bold text-sm text-slate-400">No active profile loaded</p>
                <p className="text-xs text-slate-500 mt-1">Upload a resume in the <b>Upload & Scan</b> section first to get a personalized roadmap.</p>
              </div>
            )}
          </div>
        )}

        {/* 8. RECRUITER CONSOLE TAB */}
        {activeTab === "recruiter" && (user?.role === "admin" || user?.role === "recruiter") && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                Recruiter Console
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 uppercase tracking-wide">
                  {user.role} View
                </span>
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Audit all resumes submitted globally, monitor ATS scores, and extract full evaluation logs.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              {recruiterLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <span className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></span>
                  <span className="text-xs text-slate-500 font-semibold">Loading candidate profiles...</span>
                </div>
              ) : recruiterResumes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-950/40">
                        <th className="px-6 py-4.5">Candidate</th>
                        <th className="px-6 py-4.5">File Name</th>
                        <th className="px-6 py-4.5">ATS Score</th>
                        <th className="px-6 py-4.5">Scan Date</th>
                        <th className="px-6 py-4.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 text-xs font-medium">
                      {recruiterResumes.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/35 transition-all">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{item.candidate_name}</div>
                            <div className="text-[10px] text-slate-500">{item.candidate_email}</div>
                          </td>
                          <td className="px-6 py-4 truncate max-w-xs font-semibold text-white">
                            {item.file_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold border ${
                              (item.ats_score ?? 0) >= 70
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : (item.ats_score ?? 0) >= 40
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                              {item.ats_score ?? 0}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(item.uploaded_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => loadResumeDetails(item.id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-[10px] font-bold text-white transition-all shadow-md shadow-blue-500/5 inline-flex items-center gap-1"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={() => handleExportReport(item.id, item.file_name)}
                              className="px-3 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-all inline-flex items-center gap-1"
                            >
                              Export
                            </button>
                            <button
                              onClick={() => handleDeleteResume(item.id)}
                              className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-[10px] font-bold text-red-400 transition-all inline-flex items-center gap-1"
                              title="Delete Candidate Resume"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.978 11.978 0 0 1 12 20.25a11.978 11.978 0 0 1-3-1.013V19.12c0-1.113.285-2.16.786-3.07M7.5 19.128a9.38 9.38 0 0 1-2.625.372 9.337 9.337 0 0 1-4.121-.952 4.125 4.125 0 0 1 7.533-2.493M13.5 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold italic">No global scan histories found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. USER PROFILE & SETTINGS TAB */}
        {activeTab === "profile" && (
          <div className="max-w-6xl mx-auto pb-20 animate-fade-in space-y-6">
            {/* Global Header Banner */}
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800/90 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden backdrop-blur-xl shadow-2xl shadow-black/40">
              <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
              <div className="flex items-center gap-5 z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 border-2 border-blue-400/30 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-blue-500/20">
                  {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-black text-white tracking-tight">{user?.full_name || "User Profile"}</h1>
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">{user?.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-500 font-semibold">
                    {profileForm.current_role && (
                      <span className="bg-slate-950/60 px-2.5 py-0.5 rounded-md border border-slate-800 text-blue-400">
                        {profileForm.current_role}
                      </span>
                    )}
                    {profileForm.city && (
                      <span className="flex items-center gap-1 text-slate-400 bg-slate-950/40 px-2.5 py-0.5 rounded-md border border-slate-800/80">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {profileForm.city}{profileForm.country ? `, ${profileForm.country}` : ""}
                      </span>
                    )}

                    {/* GitHub Chip */}
                    {profileForm.github_url && !validateSocialUrl(profileForm.github_url, "github") && (
                      <a
                        href={profileForm.github_url.startsWith("http") ? profileForm.github_url : `https://${profileForm.github_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all group"
                      >
                        <svg className="w-3.5 h-3.5 fill-current text-slate-400 group-hover:text-white" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        <span>GitHub</span>
                      </a>
                    )}

                    {/* LinkedIn Chip */}
                    {profileForm.linkedin_url && !validateSocialUrl(profileForm.linkedin_url, "linkedin") && (
                      <a
                        href={profileForm.linkedin_url.startsWith("http") ? profileForm.linkedin_url : `https://${profileForm.linkedin_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/60 text-blue-300 hover:text-white transition-all group"
                      >
                        <svg className="w-3.5 h-3.5 fill-current text-blue-400 group-hover:text-white" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.75a1.48 1.48 0 1 0 0 2.96 1.48 1.48 0 0 0 0-2.96z"/>
                        </svg>
                        <span>LinkedIn</span>
                      </a>
                    )}

                    {/* Portfolio Chip */}
                    {profileForm.portfolio_url && !validateSocialUrl(profileForm.portfolio_url, "portfolio") && (
                      <a
                        href={profileForm.portfolio_url.startsWith("http") ? profileForm.portfolio_url : `https://${profileForm.portfolio_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-violet-950/40 hover:bg-violet-900/60 border border-violet-800/60 text-violet-300 hover:text-white transition-all group"
                      >
                        <span className="text-xs">🌐</span>
                        <span>Portfolio</span>
                      </a>
                    )}

                    {/* LeetCode Chip */}
                    {profileForm.leetcode_url && !validateSocialUrl(profileForm.leetcode_url, "leetcode") && (
                      <a
                        href={profileForm.leetcode_url.startsWith("http") ? profileForm.leetcode_url : `https://${profileForm.leetcode_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 text-amber-300 hover:text-white transition-all group"
                      >
                        <span className="text-xs">🧩</span>
                        <span>LeetCode</span>
                      </a>
                    )}

                    {/* HackerRank Chip */}
                    {profileForm.hackerrank_url && !validateSocialUrl(profileForm.hackerrank_url, "hackerrank") && (
                      <a
                        href={profileForm.hackerrank_url.startsWith("http") ? profileForm.hackerrank_url : `https://${profileForm.hackerrank_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300 hover:text-white transition-all group"
                      >
                        <span className="text-xs">🏆</span>
                        <span>HackerRank</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {profileSubTab !== "security" && profileSubTab !== "resume" && (
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="z-10 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-95 flex items-center gap-2 self-stretch md:self-auto justify-center"
                >
                  {profileSaving ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              )}
            </div>

            {profileSuccessMsg && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2.5 shadow-lg shadow-emerald-500/5 animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                {profileSuccessMsg}
              </div>
            )}

            {/* Vertical Layout (Left Sub-Navigation + Right Active Section Panel) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
              {/* Left Vertical Sub-Navigation Menu */}
              <div className="md:col-span-1 bg-slate-900/70 border border-slate-800/90 rounded-3xl p-3 backdrop-blur-xl shadow-xl shadow-black/30 space-y-1 sticky top-4">
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-800/60 mb-1">
                  Profile Options
                </div>

                <button
                  onClick={() => setProfileSubTab("personal")}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                    profileSubTab === "personal"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 font-extrabold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs">👤</span>
                  Personal Info
                </button>

                <button
                  onClick={() => setProfileSubTab("education")}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                    profileSubTab === "education"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 font-extrabold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xs">🎓</span>
                  Education
                </button>

                <button
                  onClick={() => setProfileSubTab("professional")}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                    profileSubTab === "professional"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 font-extrabold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs">💼</span>
                  Professional
                </button>

                <button
                  onClick={() => setProfileSubTab("social")}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                    profileSubTab === "social"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 font-extrabold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-xs">🌐</span>
                  Social Links
                </button>

                <button
                  onClick={() => setProfileSubTab("resume")}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                    profileSubTab === "resume"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 font-extrabold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-xs">📄</span>
                  Resume Stats
                </button>

                <button
                  onClick={() => setProfileSubTab("security")}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                    profileSubTab === "security"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 font-extrabold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs">⚙️</span>
                  Security
                </button>
              </div>

              {/* Right Content Active Panel */}
              <div className="md:col-span-3">
                {/* 👤 1. Personal Info Panel */}
                {profileSubTab === "personal" && (
                  <div className="rounded-3xl bg-slate-900/70 border border-slate-800/90 p-6 md:p-8 space-y-6 backdrop-blur-xl shadow-xl shadow-black/30 animate-fade-in">
                    <div className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm">👤</span>
                          Personal Information
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Basic contact and personal identification details</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Required Fields *</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1">
                          Full Name <span className="text-blue-400">*</span>
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          value={profileForm.full_name || ""}
                          onChange={handleProfileInputChange}
                          placeholder="Your Full Name"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={user?.email || ""}
                          disabled
                          readOnly
                          className="w-full bg-slate-950/40 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-500 cursor-not-allowed font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Mobile Number</label>
                        <div className="flex items-center gap-2">
                          {/* Country Code Dropdown Selector */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowCodeDropdown(!showCodeDropdown)}
                              className="h-11 px-3 bg-slate-950/80 border border-slate-800/90 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer whitespace-nowrap"
                            >
                              <span>{COUNTRY_CODES.find((c) => c.code === countryCode)?.flag || "🌐"}</span>
                              <span>{countryCode}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>

                            {/* Floating Dropdown Menu with Search */}
                            {showCodeDropdown && (
                              <div className="absolute z-50 left-0 top-full mt-1.5 w-64 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl p-2 space-y-2 animate-fade-in">
                                <input
                                  type="text"
                                  value={codeSearchQuery}
                                  onChange={(e) => setCodeSearchQuery(e.target.value)}
                                  placeholder="Search country or code..."
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />

                                <div className="max-h-48 overflow-y-auto space-y-0.5 divide-y divide-slate-800/40">
                                  {COUNTRY_CODES.filter(
                                    (c) =>
                                      c.country.toLowerCase().includes(codeSearchQuery.toLowerCase()) ||
                                      c.code.includes(codeSearchQuery)
                                  ).map((item, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => handleSelectCountryCode(item)}
                                      className={`w-full px-3 py-2 text-left text-xs rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                                        countryCode === item.code ? "bg-blue-600/30 text-blue-300 font-bold" : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{item.flag}</span>
                                        <span className="font-semibold">{item.country}</span>
                                      </div>
                                      <span className="font-mono text-slate-400">{item.code}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Phone Number Input (Strict maxLength enforce) */}
                          <input
                            type="tel"
                            name="phone_number"
                            maxLength={getMaxDigitsForCurrentCountry()}
                            value={getPhoneNumberOnly()}
                            onChange={(e) => handlePhoneNumberChange(e.target.value)}
                            className="flex-1 bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          />
                        </div>
                      </div>

                      {/* Birthday Picker (Day / Month / Year Dropdowns) */}
                      <div className="md:col-span-2 bg-slate-950/50 border border-slate-800/90 rounded-2xl p-4 space-y-2">
                        <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>🎂</span> Date of Birth (Birthday Picker)
                          </span>
                          {profileForm.dob && (
                            <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                              Selected: {profileForm.dob}
                            </span>
                          )}
                        </label>

                        <div className="grid grid-cols-3 gap-3 pt-1">
                          {/* Day Selector */}
                          <div>
                            <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Day</span>
                            <select
                              value={profileForm.dob ? profileForm.dob.split("-")[2] || "" : ""}
                              onChange={(e) => {
                                const selectedDay = e.target.value;
                                const parts = profileForm.dob ? profileForm.dob.split("-") : ["2005", "01", "01"];
                                const yr = parts[0] || "2005";
                                const mo = parts[1] || "01";
                                if (selectedDay) {
                                  setProfileForm({ ...profileForm, dob: `${yr}-${mo}-${selectedDay}` });
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                              <option value="">Day</option>
                              {Array.from({ length: 31 }, (_, i) => {
                                const dayVal = String(i + 1).padStart(2, "0");
                                return (
                                  <option key={dayVal} value={dayVal}>
                                    {dayVal}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Month Selector */}
                          <div>
                            <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Month</span>
                            <select
                              value={profileForm.dob ? profileForm.dob.split("-")[1] || "" : ""}
                              onChange={(e) => {
                                const selectedMonth = e.target.value;
                                const parts = profileForm.dob ? profileForm.dob.split("-") : ["2005", "01", "01"];
                                const yr = parts[0] || "2005";
                                const dy = parts[2] || "01";
                                if (selectedMonth) {
                                  setProfileForm({ ...profileForm, dob: `${yr}-${selectedMonth}-${dy}` });
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                              <option value="">Month</option>
                              {[
                                { num: "01", name: "01 - January" },
                                { num: "02", name: "02 - February" },
                                { num: "03", name: "03 - March" },
                                { num: "04", name: "04 - April" },
                                { num: "05", name: "05 - May" },
                                { num: "06", name: "06 - June" },
                                { num: "07", name: "07 - July" },
                                { num: "08", name: "08 - August" },
                                { num: "09", name: "09 - September" },
                                { num: "10", name: "10 - October" },
                                { num: "11", name: "11 - November" },
                                { num: "12", name: "12 - December" },
                              ].map((m) => (
                                <option key={m.num} value={m.num}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Year Selector */}
                          <div>
                            <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Year</span>
                            <select
                              value={profileForm.dob ? profileForm.dob.split("-")[0] || "" : ""}
                              onChange={(e) => {
                                const selectedYear = e.target.value;
                                const parts = profileForm.dob ? profileForm.dob.split("-") : ["2005", "01", "01"];
                                const mo = parts[1] || "01";
                                const dy = parts[2] || "01";
                                if (selectedYear) {
                                  setProfileForm({ ...profileForm, dob: `${selectedYear}-${mo}-${dy}` });
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                              <option value="">Year</option>
                              {Array.from({ length: 70 }, (_, i) => {
                                const yearVal = String(2026 - i);
                                return (
                                  <option key={yearVal} value={yearVal}>
                                    {yearVal}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Gender (Optional)</label>
                        <select
                          name="gender"
                          value={profileForm.gender || ""}
                          onChange={handleProfileInputChange}
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Current City</label>
                        <input
                          type="text"
                          name="city"
                          autoComplete="off"
                          value={profileForm.city || ""}
                          onChange={(e) => handleCityChange(e.target.value)}
                          onFocus={() => {
                            if (profileForm.city && profileForm.city.trim().length >= 1) {
                              const matches = CITIES_DATA.filter((c) =>
                                c.city.toLowerCase().includes(profileForm.city.trim().toLowerCase())
                              ).slice(0, 8);
                              setCitySuggestions(matches);
                              setShowCityDropdown(matches.length > 0);
                            }
                          }}
                          placeholder="Enter your city"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />

                        {/* Floating City Suggestions Dropdown */}
                        {showCityDropdown && citySuggestions.length > 0 && (
                          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl max-h-56 overflow-y-auto divide-y divide-slate-800/60 animate-fade-in">
                            {citySuggestions.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectCitySuggestion(item)}
                                className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">📍</span>
                                  <span className="font-bold text-white group-hover:text-white">{item.city}</span>
                                </div>
                                <span className="text-[11px] font-medium text-slate-400 group-hover:text-blue-100">
                                  {item.state}, {item.country}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">State</label>
                        <input
                          type="text"
                          name="state"
                          value={profileForm.state || ""}
                          onChange={handleProfileInputChange}
                          placeholder="e.g. Gujarat / Maharashtra"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={profileForm.country || ""}
                          onChange={handleProfileInputChange}
                          placeholder="e.g. India"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 🎓 2. Education Panel */}
                {profileSubTab === "education" && (
                  <div className="rounded-3xl bg-slate-900/70 border border-slate-800/90 p-6 md:p-8 space-y-6 backdrop-blur-xl shadow-xl shadow-black/30 animate-fade-in">
                    <div className="border-b border-slate-800/80 pb-4">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-sm">🎓</span>
                        Academic & Education
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">College, degree, specialization, and academic evaluation</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-2">College / University Name</label>
                        <input
                          type="text"
                          name="college"
                          value={profileForm.college || ""}
                          onChange={handleProfileInputChange}
                          placeholder="e.g. GTU / Nirma University / IIT Bombay"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Degree</label>
                        <input
                          type="text"
                          name="degree"
                          value={profileForm.degree || ""}
                          onChange={handleProfileInputChange}
                          placeholder="e.g. B.Tech / B.E. / BCA / MCA"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Branch / Specialization</label>
                        <input
                          type="text"
                          name="branch"
                          value={profileForm.branch || ""}
                          onChange={handleProfileInputChange}
                          placeholder="e.g. Computer Engineering / Information Technology"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Current Semester / Year</label>
                        <input
                          type="text"
                          name="current_semester"
                          value={profileForm.current_semester || ""}
                          onChange={handleProfileInputChange}
                          placeholder="e.g. 7th Semester / 4th Year"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Graduation Year</label>
                        <input
                          type="text"
                          name="graduation_year"
                          value={profileForm.graduation_year || ""}
                          onChange={handleProfileInputChange}
                          placeholder="e.g. 2025"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-2">CGPA / Percentage (Optional)</label>
                        <input
                          type="text"
                          name="cgpa"
                          value={profileForm.cgpa || ""}
                          onChange={handleProfileInputChange}
                          placeholder="e.g. 8.5 CGPA / 85%"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 💼 3. Professional Panel */}
                {profileSubTab === "professional" && (
                  <div className="rounded-3xl bg-slate-900/70 border border-slate-800/90 p-6 md:p-8 space-y-6 backdrop-blur-xl shadow-xl shadow-black/30 animate-fade-in">
                    <div className="border-b border-slate-800/80 pb-4">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm">💼</span>
                        Professional Profile & Preferences
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Role preferences, career goals, and experience level</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Current Role Status</label>
                        <select
                          name="current_role"
                          value={profileForm.current_role || ""}
                          onChange={handleProfileInputChange}
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                          <option value="">Select Status</option>
                          <option value="Student">Student</option>
                          <option value="Fresher">Fresher</option>
                          <option value="Working Professional">Working Professional</option>
                          <option value="Freelancer">Freelancer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Years of Experience</label>
                        <input
                          type="text"
                          name="experience_years"
                          value={profileForm.experience_years || ""}
                          onChange={handleProfileInputChange}
                          placeholder="e.g. 0 Years (Fresher) / 2 Years"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Preferred Job Role</label>
                        <input
                          type="text"
                          name="preferred_role"
                          value={profileForm.preferred_role || ""}
                          onChange={handleProfileInputChange}
                          placeholder="e.g. Full Stack Developer / AI Engineer"
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Preferred Work Mode</label>
                        <select
                          name="preferred_work_mode"
                          value={profileForm.preferred_work_mode || ""}
                          onChange={handleProfileInputChange}
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        >
                          <option value="">Select Preference</option>
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="On-site">On-site</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Career Objective / About Me</label>
                        <textarea
                          name="about_me"
                          rows={4}
                          value={profileForm.about_me || ""}
                          onChange={handleProfileInputChange}
                          placeholder="Write a brief professional summary about your career goals and technical aspirations..."
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 🌐 5. Social Links Panel */}
                {profileSubTab === "social" && (
                  <div className="rounded-3xl bg-slate-900/70 border border-slate-800/90 p-6 md:p-8 space-y-6 backdrop-blur-xl shadow-xl shadow-black/30 animate-fade-in">
                    <div className="border-b border-slate-800/80 pb-4">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sm">🌐</span>
                        Social & Portfolio Handles
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Connect your code repositories and online profiles</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">GitHub URL</label>
                        <input
                          type="url"
                          name="github_url"
                          value={profileForm.github_url || ""}
                          onChange={handleProfileInputChange}
                          placeholder="https://github.com/username"
                          className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none transition-all ${
                            validateSocialUrl(profileForm.github_url, "github")
                              ? "border-rose-500/80 ring-2 ring-rose-500/20"
                              : "border-slate-800/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          }`}
                        />
                        {validateSocialUrl(profileForm.github_url, "github") && (
                          <p className="text-[11px] font-semibold text-rose-400 mt-1.5 flex items-center gap-1">
                            <span>⚠️</span> {validateSocialUrl(profileForm.github_url, "github")}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">LinkedIn URL</label>
                        <input
                          type="url"
                          name="linkedin_url"
                          value={profileForm.linkedin_url || ""}
                          onChange={handleProfileInputChange}
                          placeholder="https://linkedin.com/in/username"
                          className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none transition-all ${
                            validateSocialUrl(profileForm.linkedin_url, "linkedin")
                              ? "border-rose-500/80 ring-2 ring-rose-500/20"
                              : "border-slate-800/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          }`}
                        />
                        {validateSocialUrl(profileForm.linkedin_url, "linkedin") && (
                          <p className="text-[11px] font-semibold text-rose-400 mt-1.5 flex items-center gap-1">
                            <span>⚠️</span> {validateSocialUrl(profileForm.linkedin_url, "linkedin")}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Portfolio Website (Optional)</label>
                        <input
                          type="url"
                          name="portfolio_url"
                          value={profileForm.portfolio_url || ""}
                          onChange={handleProfileInputChange}
                          placeholder="https://yourportfolio.com"
                          className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none transition-all ${
                            validateSocialUrl(profileForm.portfolio_url, "portfolio")
                              ? "border-rose-500/80 ring-2 ring-rose-500/20"
                              : "border-slate-800/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          }`}
                        />
                        {validateSocialUrl(profileForm.portfolio_url, "portfolio") && (
                          <p className="text-[11px] font-semibold text-rose-400 mt-1.5 flex items-center gap-1">
                            <span>⚠️</span> {validateSocialUrl(profileForm.portfolio_url, "portfolio")}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">LeetCode URL (Optional)</label>
                        <input
                          type="url"
                          name="leetcode_url"
                          value={profileForm.leetcode_url || ""}
                          onChange={handleProfileInputChange}
                          placeholder="https://leetcode.com/u/username"
                          className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none transition-all ${
                            validateSocialUrl(profileForm.leetcode_url, "leetcode")
                              ? "border-rose-500/80 ring-2 ring-rose-500/20"
                              : "border-slate-800/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          }`}
                        />
                        {validateSocialUrl(profileForm.leetcode_url, "leetcode") && (
                          <p className="text-[11px] font-semibold text-rose-400 mt-1.5 flex items-center gap-1">
                            <span>⚠️</span> {validateSocialUrl(profileForm.leetcode_url, "leetcode")}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-300 mb-2">HackerRank URL (Optional)</label>
                        <input
                          type="url"
                          name="hackerrank_url"
                          value={profileForm.hackerrank_url || ""}
                          onChange={handleProfileInputChange}
                          placeholder="https://hackerrank.com/profile/username"
                          className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none transition-all ${
                            validateSocialUrl(profileForm.hackerrank_url, "hackerrank")
                              ? "border-rose-500/80 ring-2 ring-rose-500/20"
                              : "border-slate-800/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          }`}
                        />
                        {validateSocialUrl(profileForm.hackerrank_url, "hackerrank") && (
                          <p className="text-[11px] font-semibold text-rose-400 mt-1.5 flex items-center gap-1">
                            <span>⚠️</span> {validateSocialUrl(profileForm.hackerrank_url, "hackerrank")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 📄 6. Resume Analytics Panel */}
                {profileSubTab === "resume" && (
                  <div className="rounded-3xl bg-slate-900/70 border border-slate-800/90 p-6 md:p-8 space-y-6 backdrop-blur-xl shadow-xl shadow-black/30 animate-fade-in">
                    <div className="border-b border-slate-800/80 pb-4">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-sm">📄</span>
                        Resume Analytics Summary
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Automatic sync of your latest analyzed resume metrics</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 shadow-inner">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Current Resume Name</p>
                        <p className="text-xs font-bold text-white truncate mt-2">{profileStats?.current_resume_name || "None Uploaded"}</p>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 shadow-inner">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Upload Date</p>
                        <p className="text-xs font-bold text-slate-300 truncate mt-2">{profileStats?.resume_upload_date || "N/A"}</p>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 shadow-inner">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Latest ATS Score</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1.5">{profileStats?.latest_ats_score ?? 0}%</p>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 shadow-inner">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Uploads</p>
                        <p className="text-2xl font-black text-blue-400 mt-1.5">{profileStats?.total_resume_uploads ?? 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ⚙️ 7. Security Panel */}
                {profileSubTab === "security" && (
                  <form onSubmit={handleChangePassword} className="rounded-3xl bg-slate-900/70 border border-slate-800/90 p-6 md:p-8 space-y-6 backdrop-blur-xl shadow-xl shadow-black/30 animate-fade-in">
                    <div className="border-b border-slate-800/80 pb-4">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-sm">⚙️</span>
                        Account Security & Password
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Update your login security credentials</p>
                    </div>

                    {passwordMsg && (
                      <div className={`rounded-2xl border p-4 text-xs font-bold shadow-lg ${
                        passwordMsg.type === "success"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-red-500/30 bg-red-500/10 text-red-400"
                      }`}>
                        {passwordMsg.text}
                      </div>
                    )}

                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Current Password</label>
                        <input
                          type="password"
                          value={passwordForm.current_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                          placeholder="••••••••"
                          required
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">New Password</label>
                        <input
                          type="password"
                          value={passwordForm.new_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                          placeholder="••••••••"
                          required
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordForm.confirm_password}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                          placeholder="••••••••"
                          required
                          className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl px-4 py-3 text-xs font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordSaving}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                    >
                      {passwordSaving ? "Updating Password..." : "Change Password"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;