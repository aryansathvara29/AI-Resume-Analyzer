import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { CITIES_DATA, type CityItem } from "../utils/citiesData";
import { COUNTRY_CODES, type CountryCodeItem } from "../utils/countryCodes";
import { SkillVerificationModal } from "../components/SkillVerificationModal";

// -------------------------------------------------------------
// Recruiter Presets & Priority Match Scoring Helper
// -------------------------------------------------------------
export const RECRUITER_PRESET_ROLES = [
  {
    title: "Full Stack Developer",
    icon: "🚀",
    skills: ["react", "node.js", "python", "fastapi", "sql", "git"],
  },
  {
    title: "Python Backend Developer",
    icon: "🐍",
    skills: ["python", "fastapi", "django", "postgresql", "docker", "rest api"],
  },
  {
    title: "Frontend Specialist",
    icon: "⚛️",
    skills: ["react", "typescript", "javascript", "html", "css", "tailwind"],
  },
  {
    title: "AI / ML Engineer",
    icon: "🤖",
    skills: ["python", "machine learning", "deep learning", "nlp", "tensorflow", "pytorch", "gemini"],
  },
  {
    title: "Cloud & DevOps Architect",
    icon: "☁️",
    skills: ["docker", "kubernetes", "aws", "linux", "git", "ci/cd"],
  },
  {
    title: "Java Enterprise Developer",
    icon: "☕",
    skills: ["java", "spring", "spring boot", "mysql", "rest api"],
  },
  {
    title: "Data Scientist / Analyst",
    icon: "📊",
    skills: ["python", "sql", "pandas", "numpy", "machine learning", "mysql"],
  },
];

export const computeCandidateMatch = (c: any, targetRole: string, targetSkills: string[]) => {
  const text = (
    (c.extracted_text || "") + " " +
    (c.candidate_role || "") + " " +
    (c.candidate_about || "") + " " +
    (c.file_name || "")
  ).toLowerCase();

  const candidateSkills = (c.detected_skills || []).map((s: string) => s.toLowerCase());
  const verifiedList = c.verified_skills || [];

  // Determine effective skills to match against
  let skillsToMatch = targetSkills.map((s) => s.toLowerCase().trim()).filter(Boolean);
  if (skillsToMatch.length === 0 && targetRole.trim()) {
    const matchedPreset = RECRUITER_PRESET_ROLES.find(
      (r) => r.title.toLowerCase() === targetRole.toLowerCase()
    );
    if (matchedPreset) {
      skillsToMatch = matchedPreset.skills;
    } else {
      skillsToMatch = targetRole
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2 && !["the", "and", "for", "with", "developer", "engineer"].includes(w));
    }
  }

  let matchedSkills: string[] = [];
  let missingSkills: string[] = [];
  let skillMatchRatio = 0;

  if (skillsToMatch.length > 0) {
    matchedSkills = skillsToMatch.filter((sk) => {
      return (
        candidateSkills.some((cs: string) => cs.includes(sk) || sk.includes(cs)) ||
        text.includes(sk)
      );
    });
    missingSkills = skillsToMatch.filter((sk) => !matchedSkills.includes(sk));
    skillMatchRatio = matchedSkills.length / skillsToMatch.length;
  } else {
    skillMatchRatio = Math.min(1, (candidateSkills.length * 10) / 100);
    matchedSkills = candidateSkills;
  }

  // Verification priority boost (Certificates & Passed AI Tests)
  let verifiedBoost = 0;
  const verifiedMatching = verifiedList.filter((v: any) =>
    skillsToMatch.length > 0
      ? skillsToMatch.some((sk) => (v.skill_name || "").toLowerCase().includes(sk))
      : true
  );
  if (verifiedMatching.length > 0) {
    verifiedBoost = Math.min(25, verifiedMatching.length * 12);
  } else if (verifiedList.length > 0) {
    verifiedBoost = 10;
  }

  // Role title alignment boost
  let roleTitleBoost = 0;
  if (
    targetRole.trim() &&
    (
      (c.candidate_role || "").toLowerCase().includes(targetRole.toLowerCase()) ||
      (c.file_name || "").toLowerCase().includes(targetRole.toLowerCase())
    )
  ) {
    roleTitleBoost = 10;
  }

  // Overall ATS weight
  const atsWeight = ((c.ats_score || 0) * 0.2);

  let score = Math.round(skillMatchRatio * 55 + verifiedBoost + roleTitleBoost + atsWeight);
  score = Math.max(15, Math.min(99, score));

  if (skillsToMatch.length > 0 && matchedSkills.length === skillsToMatch.length && verifiedMatching.length > 0) {
    score = 100;
  }

  let tier: "top" | "high" | "moderate" | "partial" = "partial";
  if (score >= 85) tier = "top";
  else if (score >= 70) tier = "high";
  else if (score >= 50) tier = "moderate";

  return {
    score,
    tier,
    matchedSkills,
    missingSkills,
    verifiedCount: verifiedList.length,
    verifiedList,
    verifiedMatchingCount: verifiedMatching.length,
  };
};

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
  const [jobDescription, setJobDescription] = useState<string>("");
  const [jobMatchResult, setJobMatchResult] = useState<string>("");
  const [matchLoading, setMatchLoading] = useState<boolean>(false);
  const [resumeSelecting, setResumeSelecting] = useState<boolean>(false);

  // Identified Skills Dropdown and AI Test Section states
  const [selectedSkillDropdown, setSelectedSkillDropdown] = useState<string>("");
  const [isSkillDropdownOpen, setIsSkillDropdownOpen] = useState<boolean>(false);
  const [aiTestMode, setAiTestMode] = useState<"idle" | "loading" | "quiz" | "result">("idle");
  const [aiTestQuestions, setAiTestQuestions] = useState<{ id: number; skill?: string; question: string; options: string[]; correct_index: number }[]>([]);
  const [aiTestCurrentIdx, setAiTestCurrentIdx] = useState<number>(0);
  const [aiTestSelectedAnswers, setAiTestSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [aiTestSubmitting, setAiTestSubmitting] = useState<boolean>(false);
  const [aiTestTargetSkill, setAiTestTargetSkill] = useState<string>("");
  const [aiTestResult, setAiTestResult] = useState<{
    skill_name: string;
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    status: string;
    learning_resources?: any[];
  } | null>(null);
  const [aiTestError, setAiTestError] = useState<string>("");

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

  // Recruiter Talent Hub states
  const [recruiterResumes, setRecruiterResumes] = useState<any[]>([]);
  const [recruiterLoading, setRecruiterLoading] = useState(false);
  const [recruiterSubTab, setRecruiterSubTab] = useState<"search" | "shortlist" | "analytics">("search");
  const [searchRole, setSearchRole] = useState<string>("Full Stack Developer");
  const [searchSkills, setSearchSkills] = useState<string[]>(["react", "node.js", "sql"]);
  const [customSkillInput, setCustomSkillInput] = useState<string>("");
  const [minAtsFilter, setMinAtsFilter] = useState<number>(0);
  const [verifiedOnlyFilter, setVerifiedOnlyFilter] = useState<boolean>(false);
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [recruiterSortBy, setRecruiterSortBy] = useState<"priority" | "ats" | "verified" | "newest">("priority");
  const [recruiterViewMode, setRecruiterViewMode] = useState<"grid" | "table">("grid");
  const [shortlistedMap, setShortlistedMap] = useState<{ [id: number]: { status: string; date: string } }>(() => {
    try {
      const saved = localStorage.getItem("recruiter_shortlist");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [dossierCandidate, setDossierCandidate] = useState<any | null>(null);

  const toggleShortlist = (candidateId: number) => {
    setShortlistedMap((prev) => {
      const next = { ...prev };
      if (next[candidateId]) {
        delete next[candidateId];
      } else {
        next[candidateId] = {
          status: "Shortlisted",
          date: new Date().toISOString(),
        };
      }
      try {
        localStorage.setItem("recruiter_shortlist", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save shortlist", e);
      }
      return next;
    });
  };

  const updateCandidateStatus = (candidateId: number, status: string) => {
    setShortlistedMap((prev) => {
      const next = {
        ...prev,
        [candidateId]: {
          status,
          date: prev[candidateId]?.date || new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem("recruiter_shortlist", JSON.stringify(next));
      } catch (e) {
        console.error("Failed to save shortlist", e);
      }
      return next;
    });
  };

  const exportShortlistReport = () => {
    const list = recruiterResumes.filter((c) => shortlistedMap[c.id]);
    if (list.length === 0) {
      alert("No candidates in your shortlist yet.");
      return;
    }

    let csvContent = "Candidate Name,Email,Phone,City,Experience,Target Role,ATS Score,Status,Verified Skills\n";
    list.forEach((c) => {
      const status = shortlistedMap[c.id]?.status || "Shortlisted";
      const verified = (c.verified_skills || []).map((v: any) => v.skill_name).join("; ");
      csvContent += `"${c.candidate_name || ''}","${c.candidate_email || ''}","${c.candidate_phone || ''}","${c.candidate_city || ''}","${c.candidate_experience || ''}","${c.candidate_role || ''}","${c.ats_score || 0}%","${status}","${verified}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Shortlisted_Candidates_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Ranked Candidates
  const filteredCandidates = useMemo(() => {
    return recruiterResumes
      .map((candidate) => {
        const match = computeCandidateMatch(candidate, searchRole, searchSkills);
        return { ...candidate, match };
      })
      .filter((candidate) => {
        if (minAtsFilter > 0 && (candidate.ats_score || 0) < minAtsFilter) return false;
        if (verifiedOnlyFilter && candidate.match.verifiedCount === 0) return false;
        if (experienceFilter !== "all") {
          const expStr = (candidate.candidate_experience || "").toLowerCase();
          if (experienceFilter === "fresher" && !expStr.includes("fresh") && !expStr.includes("0")) {
            return false;
          } else if (experienceFilter === "1-2" && !expStr.includes("1") && !expStr.includes("2")) {
            return false;
          } else if (experienceFilter === "3+" && !expStr.includes("3") && !expStr.includes("4") && !expStr.includes("5")) {
            return false;
          }
        }
        if (locationFilter.trim()) {
          const cityStr = (candidate.candidate_city || "").toLowerCase();
          if (!cityStr.includes(locationFilter.toLowerCase().trim())) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (recruiterSortBy === "priority") {
          return b.match.score - a.match.score;
        }
        if (recruiterSortBy === "ats") {
          return (b.ats_score || 0) - (a.ats_score || 0);
        }
        if (recruiterSortBy === "verified") {
          return b.match.verifiedCount - a.match.verifiedCount;
        }
        if (recruiterSortBy === "newest") {
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
        }
        return 0;
      });
  }, [
    recruiterResumes,
    searchRole,
    searchSkills,
    minAtsFilter,
    verifiedOnlyFilter,
    experienceFilter,
    locationFilter,
    recruiterSortBy,
  ]);

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
  const [profileSubTab, setProfileSubTab] = useState<"personal" | "education" | "professional" | "skills" | "social" | "resume" | "skill_verification" | "security">("personal");
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Skill Verification States
  const [skillVerifications, setSkillVerifications] = useState<{ [skill: string]: any }>({});
  const [selectedSkillToVerify, setSelectedSkillToVerify] = useState<string | null>(null);

  const fetchSkillVerifications = async (targetResumeId?: number) => {
    try {
      const rId = targetResumeId !== undefined ? targetResumeId : selectedResume?.id;
      const url = rId ? `/skills/verifications?resume_id=${rId}` : "/skills/verifications";
      const res = await api.get(url);
      const map: { [skill: string]: any } = {};
      if (Array.isArray(res.data)) {
        res.data.forEach((v: any) => {
          map[v.skill_name.toLowerCase()] = v;
        });
      }
      setSkillVerifications(map);
    } catch (err) {
      console.error("Error fetching skill verifications:", err);
    }
  };

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        fetchSkillVerifications();
      } catch (statsErr) {
        console.error("Error fetching stats/history:", statsErr);
      }

      if (userRes.data.role === "admin" || userRes.data.role === "recruiter") {
        if (userRes.data.role === "recruiter") {
          setActiveTab("recruiter");
        }
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

  const parseDobParts = (dobStr?: string) => {
    if (!dobStr || !dobStr.trim()) return { day: "", month: "", year: "" };
    const clean = dobStr.trim().replace(/\//g, "-");
    const parts = clean.split("-");
    if (parts.length !== 3) return { day: "", month: "", year: "" };

    // Format YYYY-MM-DD
    if (parts[0].length === 4) {
      return {
        year: parts[0],
        month: parts[1].padStart(2, "0"),
        day: parts[2].padStart(2, "0"),
      };
    }
    // Format DD-MM-YYYY
    if (parts[2].length === 4) {
      return {
        day: parts[0].padStart(2, "0"),
        month: parts[1].padStart(2, "0"),
        year: parts[2],
      };
    }
    return { day: "", month: "", year: "" };
  };

  useEffect(() => {
    if (selectedResume?.id) {
      fetchSkillVerifications(selectedResume.id);
    } else {
      fetchSkillVerifications();
    }
  }, [selectedResume?.id]);

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
  const loadResumeDetails = async (resumeId: number, switchTab: boolean = true) => {
    try {
      setUploading(true);
      setErrorMsg("");
      const res = await api.get(`/resumes/${resumeId}`);
      setSelectedResume(res.data);
      setJobMatchResult("");
      if (switchTab) setActiveTab("upload"); // switch to analysis view
    } catch (err: any) {
      console.error("Error loading resume:", err);
      const foundInHistory = history.find((item: any) => item.id === resumeId) || recruiterResumes.find((c: any) => c.id === resumeId);
      if (foundInHistory) {
        setSelectedResume(foundInHistory);
        setJobMatchResult("");
        if (switchTab) setActiveTab("upload");
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
    if (!window.confirm("Are you sure you want to delete this resume? You will then be able to upload a new resume.")) return;
    try {
      await api.delete(`/resumes/${resumeId}`);
      setHistory((prev) => prev.filter((item) => item.id !== resumeId));
      setRecruiterResumes((prev) => prev.filter((item) => item.id !== resumeId));
      if (selectedResume?.id === resumeId) {
        setSelectedResume(null);
      }
      setFile(null);
      setUploadError("");
      setUploadSuccess(false);
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

  // Select specific resume for Career Roadmap
  const handleSelectResumeForRoadmap = async (resumeId: number) => {
    const found = history.find((h) => h.id === resumeId);
    setCareerRoadmap("");
    try {
      const res = await api.get(`/resumes/${resumeId}`);
      setSelectedResume(res.data);
    } catch (err) {
      console.error("Error loading resume details for roadmap:", err);
      if (found) setSelectedResume(found as any);
    }
  };

  // Generate career roadmap
  const generateRoadmap = async (targetResumeId?: number) => {
    const resumeId = targetResumeId || selectedResume?.id || (history.length > 0 ? history[0].id : null);
    if (!resumeId) return;

    setRoadmapLoading(true);
    setCareerRoadmap("");
    try {
      let currentResume = selectedResume;
      if (!currentResume || currentResume.id !== resumeId || !currentResume.extracted_text) {
        const res = await api.get(`/resumes/${resumeId}`);
        currentResume = res.data;
        setSelectedResume(res.data);
      }

      const resumeText = currentResume?.extracted_text || "";
      if (!resumeText) {
        setCareerRoadmap("Unable to read resume text. Please ensure the resume file has readable content.");
        return;
      }

      const res = await api.post("/ai/career-roadmap", {
        resume_text: resumeText,
      });

      if (res.data.success) {
        setCareerRoadmap(res.data.roadmap);
      } else {
        setCareerRoadmap("Unable to generate roadmap at this time.");
      }
    } catch (err: any) {
      console.error("Roadmap error:", err);
      const detailMsg = err.response?.data?.detail || err.message;
      setCareerRoadmap(`Error generating career roadmap: ${detailMsg || "Make sure backend is running with Gemini API key."}`);
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

    // Enforce 1 resume per profile limit
    if (history.length > 0 || selectedResume) {
      setUploadError("Aap ek profile me ek hi resume scan kar sakte ho. Agar dusra resume upload karna hai, toh pehle wala resume delete karna hoga.");
      setFile(null);
      return;
    }

    // Check size limit (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds maximum limit of 5 MB.");
      setFile(null);
      return;
    }

    const fileExt = selectedFile.name.split(".").pop()?.toLowerCase();
    const typeStr = (selectedFile.type || "").toLowerCase();

    const isPdf = typeStr.includes("pdf") || fileExt === "pdf";
    const isDocx =
      typeStr.includes("word") ||
      typeStr.includes("officedocument") ||
      typeStr.includes("msword") ||
      fileExt === "docx" ||
      fileExt === "doc";

    if (!isPdf && !isDocx) {
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

    // Enforce 1 resume per profile limit
    if (history.length > 0 || selectedResume) {
      setUploadError("Aap ek profile me ek hi resume scan kar sakte ho. Agar dusra resume upload karna hai, toh pehle wala resume delete karna hoga.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append("file", file, file.name || "resume.pdf");

    try {
      const response = await api.post("/resumes/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedResume(response.data);
      setUploadSuccess(true);
      setFile(null);
      setJobMatchResult("");
      
      // Update statistics and history list
      fetchData();
    } catch (err: any) {
      console.error("Upload error:", err);
      let msg = err.response?.data?.detail;
      if (Array.isArray(msg)) {
        msg = msg.map((m: any) => m.msg || m).join(", ");
      }
      if (err.message === "Network Error" || !err.response) {
        setUploadError("Backend server is waking up (Render free tier cold start). Please wait 10 seconds and tap 'Start Scan' again.");
      } else {
        setUploadError(
          msg || err.message || "Upload failed. Please ensure file matches constraints."
        );
      }
    } finally {
      setUploading(false);
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

  // Extract ONLY text inside the dedicated SKILLS section
  const extractSkillsSectionText = (fullText: string): string => {
    if (!fullText || fullText.trim().length < 10) return "";

    const skillHeaders = [
      "technical skills",
      "key skills",
      "core competencies",
      "core skills",
      "skills & abilities",
      "skills and proficiencies",
      "skills and expertise",
      "areas of expertise",
      "programming skills",
      "it skills",
      "computer skills",
      "technologies",
      "skills",
    ];

    const otherHeaders = [
      "projects",
      "key projects",
      "academic projects",
      "personal projects",
      "work experience",
      "professional experience",
      "additional experience",
      "relevant experience",
      "experience",
      "employment history",
      "internships",
      "education",
      "academic background",
      "academics",
      "qualifications",
      "certifications",
      "certificates",
      "achievements",
      "accomplishments",
      "awards",
      "honors",
      "publications",
      "research",
      "summary",
      "professional summary",
      "career objective",
      "objective",
      "about me",
      "volunteering",
      "activities",
      "extra-curricular",
      "languages known",
      "personal details",
      "declaration",
      "references",
      "interests",
      "hobbies",
    ];

    const lines = fullText.split(/\r?\n/);
    let inSkillsSection = false;
    const skillsLines: string[] = [];

    const startRegex = new RegExp(`^(?:[\\s\\*\\#\\-\\•]*)\\b(${skillHeaders.join("|")})\\b[\\s\\:\\-\\|]*$`, "i");
    const stopRegex = new RegExp(`^(?:[\\s\\*\\#\\-\\•]*)\\b(${otherHeaders.join("|")})\\b[\\s\\:\\-\\|]*$`, "i");

    for (const line of lines) {
      const stripped = line.trim();
      if (!stripped) {
        if (inSkillsSection) skillsLines.push("");
        continue;
      }

      if (!inSkillsSection) {
        if (startRegex.test(stripped)) {
          inSkillsSection = true;
          continue;
        }
      } else {
        if (stopRegex.test(stripped)) {
          break;
        }
        skillsLines.push(stripped);
      }
    }

    if (!inSkillsSection || skillsLines.length === 0) {
      // Fallback regex pattern across text block
      const blockPattern = new RegExp(
        `(?:^|\\n)\\s*(?:\\d+[\\.\\)]\\s*)?(?:[\\*\\#\\-\\•]*)\\s*\\b(${skillHeaders.join("|")})\\b\\s*[\\:\\-\\|]?\\s*\\n([\\s\\S]*?)(?=\\n\\s*(?:[\\*\\#\\-\\•]*)\\s*\\b(?:${otherHeaders.join("|")})\\b\\s*[\\:\\-\\|]?\\s*\\n|$)`,
        "i"
      );
      const match = blockPattern.exec(fullText);
      if (match && match[2]) {
        return match[2].trim();
      }
      return "";
    }

    return skillsLines.join("\n").trim();
  };

  // Extract suggestions and skills list strictly from the SKILLS section
  const getDetectedSkillsAndSuggestions = (text: string) => {
    const skillsSection = extractSkillsSectionText(text);

    if (!skillsSection) {
      return {
        skills: [],
        suggestions: [
          "No dedicated 'SKILLS' or 'TECHNICAL SKILLS' section was detected in your resume.",
          "ATS scanning engines require a distinct Skills section to index candidate competencies.",
          "Add a clearly labeled 'SKILLS' section to your resume to achieve an ATS score (current score is 0%).",
        ],
      };
    }

    const lower = skillsSection.toLowerCase();

    // Comprehensive canonical skills with regex patterns
    const skillRules = [
      { name: "c", regex: /\bc\b/i },
      { name: "c++", regex: /\b(c\+\+|cpp)\b/i },
      { name: "c#", regex: /\b(c\#|csharp)\b/i },
      { name: "java", regex: /\bjava\b(?!script)/i },
      { name: "python", regex: /\bpython\b/i },
      { name: "javascript", regex: /\b(javascript|js)\b/i },
      { name: "typescript", regex: /\b(typescript|ts)\b/i },
      { name: "php", regex: /\bphp\b/i },
      { name: "go", regex: /\b(go|golang)\b/i },
      { name: "kotlin", regex: /\bkotlin\b/i },
      { name: "swift", regex: /\bswift\b/i },
      { name: "rust", regex: /\brust\b/i },
      { name: "html", regex: /\bhtml(5)?\b/i },
      { name: "css", regex: /\bcss(3)?\b/i },
      { name: "react", regex: /\breact(\.js)?\b/i },
      { name: "next.js", regex: /\bnext(\.js)?\b/i },
      { name: "vue", regex: /\bvue(\.js)?\b/i },
      { name: "angular", regex: /\bangular(\.js)?\b/i },
      { name: "tailwind", regex: /\btailwind(\s*css)?\b/i },
      { name: "bootstrap", regex: /\bbootstrap(5)?\b/i },
      { name: "fastapi", regex: /\bfastapi\b/i },
      { name: "django", regex: /\bdjango\b/i },
      { name: "flask", regex: /\bflask\b/i },
      { name: "spring", regex: /\bspring\b(?!boot)/i },
      { name: "spring boot", regex: /\bspring\s*boot\b/i },
      { name: "node.js", regex: /\bnode(\.js)?\b/i },
      { name: "express", regex: /\bexpress(\.js)?\b/i },
      { name: "mysql", regex: /\bmysql\b/i },
      { name: "postgresql", regex: /\bpostgres(ql)?\b/i },
      { name: "mongodb", regex: /\bmongodb\b/i },
      { name: "sqlite", regex: /\bsqlite(3)?\b/i },
      { name: "oracle", regex: /\boracle\b/i },
      { name: "sql", regex: /\bsql\b/i },
      { name: "numpy", regex: /\bnumpy\b/i },
      { name: "pandas", regex: /\bpandas\b/i },
      { name: "matplotlib", regex: /\bmatplotlib\b/i },
      { name: "git", regex: /\bgit\b(?!hub)/i },
      { name: "github", regex: /\bgithub\b/i },
      { name: "docker", regex: /\bdocker\b/i },
      { name: "kubernetes", regex: /\b(kubernetes|k8s)\b/i },
      { name: "aws", regex: /\b(aws|amazon\s+web\s+services)\b/i },
      { name: "azure", regex: /\bazure\b/i },
      { name: "linux", regex: /\blinux\b/i },
      { name: "machine learning", regex: /\bmachine\s+learning\b/i },
      { name: "deep learning", regex: /\bdeep\s+learning\b/i },
      { name: "tensorflow", regex: /\btensorflow\b/i },
      { name: "pytorch", regex: /\bpytorch\b/i },
      { name: "nlp", regex: /\bnlp\b/i },
      { name: "gemini", regex: /\bgemini(\s*ai)?\b/i },
    ];

    const detected: string[] = [];
    for (const rule of skillRules) {
      if (rule.regex.test(lower)) {
        detected.push(rule.name);
      }
    }

    const suggestions: string[] = [];
    if (detected.length === 0) {
      suggestions.push("No recognized technical skills found under your Skills section. Please list relevant languages and tools.");
    } else if (detected.length < 8) {
      suggestions.push("Add more core technical skills to your Skills section to improve search ranking.");
    }
    if (!detected.includes("github") && !detected.includes("git")) {
      suggestions.push("Mention version control (Git / GitHub) in your Skills section.");
    }
    if (!detected.includes("docker") && !detected.includes("kubernetes")) {
      suggestions.push("Adding Docker containerization demonstrates devops proficiency.");
    }
    if (!detected.includes("aws") && !detected.includes("azure")) {
      suggestions.push("Mention cloud operations (AWS/Azure) in Skills to raise ATS ranking.");
    }

    return { skills: Array.from(new Set(detected)), suggestions };
  };

  const currentSkillsAndSuggestions = selectedResume?.extracted_text 
    ? getDetectedSkillsAndSuggestions(selectedResume.extracted_text)
    : { skills: [], suggestions: [] };

  const effectiveAtsScore = (selectedResume && currentSkillsAndSuggestions.skills.length === 0)
    ? 0
    : (selectedResume?.ats_score ?? 0);

  const activeDropdownSkill = selectedSkillDropdown || (currentSkillsAndSuggestions.skills.length > 0 ? currentSkillsAndSuggestions.skills[0] : "");

  const handleStartInlineAITest = async (skillToTest?: string) => {
    const target = skillToTest || activeDropdownSkill;
    if (!target && currentSkillsAndSuggestions.skills.length === 0) return;

    try {
      setAiTestError("");
      setAiTestMode("loading");
      setAiTestTargetSkill(target);

      let payload: any = {};
      if (target === "ALL_SKILLS") {
        payload = {
          skills: currentSkillsAndSuggestions.skills,
          num_questions: 3 // Minimum 3 questions per skill
        };
      } else {
        payload = {
          skill_name: target,
          num_questions: 3 // Minimum 3 questions
        };
      }

      const res = await api.post("/skills/generate-test", payload);
      if (res.data.questions && res.data.questions.length > 0) {
        setAiTestQuestions(res.data.questions);
        setAiTestCurrentIdx(0);
        setAiTestSelectedAnswers({});
        setAiTestMode("quiz");
      } else {
        setAiTestError("Could not generate questions. Please try again.");
        setAiTestMode("idle");
      }
    } catch (err: any) {
      console.error("AI Test generation error:", err);
      setAiTestError(err.response?.data?.detail || "Failed to generate AI test questions. Please retry.");
      setAiTestMode("idle");
    }
  };

  const handleSubmitInlineAITest = async () => {
    try {
      setAiTestSubmitting(true);
      setAiTestError("");

      let score = 0;
      aiTestQuestions.forEach((q, idx) => {
        if (aiTestSelectedAnswers[idx] === q.correct_index) {
          score += 1;
        }
      });

      const total = aiTestQuestions.length;
      const percentage = Math.round((score / Math.max(total, 1)) * 100);
      const isPassed = percentage >= 70; // STRICT 70% PASSING THRESHOLD

      let skillsPassed: string[] = [];
      if (aiTestTargetSkill === "ALL_SKILLS") {
        if (isPassed) {
          skillsPassed = currentSkillsAndSuggestions.skills;
        }
      } else if (isPassed) {
        skillsPassed = [aiTestTargetSkill];
      }

      const res = await api.post("/skills/submit-test", {
        skill_name: aiTestTargetSkill === "ALL_SKILLS" ? (currentSkillsAndSuggestions.skills[0] || "All Skills") : aiTestTargetSkill,
        resume_id: selectedResume?.id,
        score: score,
        total: total,
        skills_passed: skillsPassed.length > 0 ? skillsPassed : undefined,
      });

      setAiTestResult({
        skill_name: aiTestTargetSkill === "ALL_SKILLS" ? "All Identified Skills" : aiTestTargetSkill,
        score: score,
        total: total,
        percentage: percentage,
        passed: isPassed,
        status: isPassed ? "verified_ai_test" : "learning_recommended",
        learning_resources: res.data.learning_resources,
      });

      setAiTestMode("result");

      // Refresh verification badges!
      if (selectedResume?.id) {
        fetchSkillVerifications(selectedResume.id);
      } else {
        fetchSkillVerifications();
      }
    } catch (err: any) {
      console.error("AI Test submission error:", err);
      setAiTestError(err.response?.data?.detail || "Failed to submit AI test results.");
    } finally {
      setAiTestSubmitting(false);
    }
  };

  const handleResetInlineAITest = () => {
    setAiTestMode("idle");
    setAiTestResult(null);
    setAiTestQuestions([]);
    setAiTestSelectedAnswers({});
    setAiTestCurrentIdx(0);
    setAiTestError("");
  };

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
            {user?.role === "recruiter" ? (
              <>
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-400/80">
                  Recruiter Workspace
                </div>
                <button
                  onClick={() => {
                    setActiveTab("recruiter");
                    setRecruiterSubTab("search");
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "recruiter" && recruiterSubTab === "search"
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  Talent Discovery
                </button>

                <button
                  onClick={() => {
                    setActiveTab("recruiter");
                    setRecruiterSubTab("shortlist");
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "recruiter" && recruiterSubTab === "shortlist"
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                    </svg>
                    Shortlisted
                  </div>
                  {Object.keys(shortlistedMap).length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {Object.keys(shortlistedMap).length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab("recruiter");
                    setRecruiterSubTab("analytics");
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "recruiter" && recruiterSubTab === "analytics"
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                  Talent Analytics
                </button>

                <div className="pt-2 pb-1 border-t border-slate-800/60 my-2"></div>

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
                  Recruiter Profile
                </button>
              </>
            ) : (
              <>
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

                {user?.role === "admin" && (
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
              </>
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
                <div className="rounded-2xl bg-slate-900/60 backdrop-blur-md p-6 border border-slate-800 space-y-4">
                  <h3 className="text-lg font-bold text-white">Upload File</h3>

                  {(selectedResume || (history && history.length > 0)) ? (
                    <div className="space-y-4">
                      {/* Warning Box */}
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4.5 space-y-3 animate-fade-in">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Single Resume Policy</h4>
                            <p className="text-xs text-amber-100 font-medium mt-1 leading-relaxed">
                              Aap ek profile me ek hi resume scan kar sakte ho. Agar dusra resume upload karna hai, toh pehle wala resume delete karna hoga.
                            </p>
                          </div>
                        </div>

                        {/* Existing Resume Item Preview */}
                        {(() => {
                          const activeRes = selectedResume || history[0];
                          return (
                            <>
                              <div className="bg-slate-950/70 rounded-lg border border-slate-800 p-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 truncate min-w-0">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-blue-400 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                  </svg>
                                  <div className="truncate">
                                    <span className="text-xs font-bold text-white block truncate">{activeRes.file_name}</span>
                                    <span className="text-[10px] text-slate-400">
                                      {activeRes.uploaded_at ? new Date(activeRes.uploaded_at).toLocaleDateString() : "Active Resume"}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                                  (activeRes.ats_score ?? 0) >= 70
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : (activeRes.ats_score ?? 0) > 0
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                }`}>
                                  {activeRes.ats_score ?? 0}% ATS
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteResume(activeRes.id)}
                                className="w-full py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-red-500/10"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-red-400">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                                Pehle Wala Resume Delete Karein
                              </button>
                            </>
                          );
                        })()}
                      </div>

                      {/* Locked Dropzone */}
                      <div
                        onClick={() => {
                          setUploadError("Aap ek profile me ek hi resume scan kar sakte ho. Agar dusra resume upload karna hai, toh pehle wala resume delete karna hoga.");
                        }}
                        className="border-2 border-dashed border-slate-800 bg-slate-950/20 rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-70 cursor-not-allowed select-none transition-all hover:border-amber-500/40"
                      >
                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 mb-2.5">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                          </svg>
                        </div>
                        <p className="text-xs font-bold text-slate-300">Upload Locked (1 Resume Limit)</p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
                          Naya resume upload karne ke liye upar diye gaye button se pehle wala resume delete karein.
                        </p>
                      </div>

                      {uploadError && (
                        <p className="text-xs text-red-400 font-semibold">{uploadError}</p>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleUploadSubmit} className="space-y-4">
                      {/* Drag & Touch Select Zone */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-6 md:p-8 flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                          isDragOver
                            ? "border-blue-500 bg-blue-500/5"
                            : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                          className="hidden"
                          disabled={uploading}
                        />

                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                          </svg>
                        </div>

                        <p className="text-xs font-bold text-white text-center">
                          {file ? file.name : "Tap to Select Resume (or Drag & Drop)"}
                        </p>
                        <p className="text-[10px] text-slate-400 text-center mt-1">
                          PDF or DOCX format (Max 5MB)
                        </p>

                        {!file && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="mt-3 px-3.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
                          >
                            📁 Select Resume File
                          </button>
                        )}
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
                  )}
                </div>

                {/* Switcher/Context display if a resume is already selected */}
                {selectedResume && (
                  <div className="rounded-2xl bg-slate-900/35 border border-slate-800/80 p-5 space-y-4.5">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Resume Profile</h4>
                      <p className="text-sm font-bold text-white mt-1 truncate">{selectedResume.file_name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Scanned {new Date(selectedResume.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setJobDescription("");
                          setJobMatchResult("");
                          setActiveTab("job-match");
                        }}
                        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 py-2 text-xs font-bold text-white hover:from-blue-500 hover:to-violet-500 transition-all flex items-center justify-center gap-1 shadow-md shadow-blue-500/5 cursor-pointer"
                      >
                        Match Jobs
                      </button>
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
                            className={`${effectiveAtsScore >= 70 ? "text-emerald-500" : effectiveAtsScore > 0 ? "text-blue-500" : "text-rose-500"} transition-all duration-1000`}
                            strokeDasharray={`${effectiveAtsScore}, 100`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className={`text-2xl font-black ${effectiveAtsScore === 0 ? "text-rose-400" : "text-white"}`}>{effectiveAtsScore}%</span>
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

                    {/* 1. IDENTIFIED SKILLS (DROPDOWN) & AI TEST SECTION (EQUAL HEIGHT ALIGNED) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      {/* Left: Identified Skills with Dropdown */}
                      <div className="lg:col-span-5 rounded-2xl bg-slate-900/40 border border-slate-850 p-6 flex flex-col justify-between h-full space-y-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
                              </svg>
                              Identified Skills ({currentSkillsAndSuggestions.skills.length})
                            </h4>
                            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                              {currentSkillsAndSuggestions.skills.filter(s => {
                                const st = skillVerifications[s.toLowerCase()]?.status;
                                return st === "verified_ai_test" || st === "verified_certificate";
                              }).length}/{currentSkillsAndSuggestions.skills.length} Verified
                            </span>
                          </div>

                          {currentSkillsAndSuggestions.skills.length > 0 ? (
                            <div className="space-y-4">
                              {/* Dropdown Selector */}
                              <div className="relative">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                                  Select Skill to Inspect / Test:
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setIsSkillDropdownOpen(!isSkillDropdownOpen)}
                                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer shadow-sm"
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="text-xs font-bold text-white capitalize truncate">
                                      {activeDropdownSkill === "ALL_SKILLS"
                                        ? `⚡ All Identified Skills (${currentSkillsAndSuggestions.skills.length})`
                                        : activeDropdownSkill}
                                    </span>
                                    {activeDropdownSkill !== "ALL_SKILLS" && (() => {
                                      const sVer = skillVerifications[activeDropdownSkill.toLowerCase()];
                                      if (sVer?.status === "verified_ai_test") return <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">AI Verified ✅</span>;
                                      if (sVer?.status === "verified_certificate") return <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Cert Verified 📜</span>;
                                      if (sVer?.status === "learning_recommended") return <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Needs 70%+ ⚠️</span>;
                                      return <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Unverified 🛡️</span>;
                                    })()}
                                  </div>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className={`w-4 h-4 text-slate-400 transition-transform ${isSkillDropdownOpen ? "rotate-180" : ""}`}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                  </svg>
                                </button>

                                {/* Dropdown Menu Items */}
                                {isSkillDropdownOpen && (
                                  <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-1.5 max-h-64 overflow-y-auto space-y-1 backdrop-blur-xl">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedSkillDropdown("ALL_SKILLS");
                                        setIsSkillDropdownOpen(false);
                                        setAiTestMode("idle");
                                        setAiTestResult(null);
                                      }}
                                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold transition-all ${
                                        activeDropdownSkill === "ALL_SKILLS"
                                          ? "bg-blue-600 text-white"
                                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                      }`}
                                    >
                                      <span>⚡ All Identified Skills ({currentSkillsAndSuggestions.skills.length})</span>
                                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-200">Test All</span>
                                    </button>
                                    <div className="h-px bg-slate-800 my-1"></div>
                                    {currentSkillsAndSuggestions.skills.map((skill) => {
                                      const sVer = skillVerifications[skill.toLowerCase()];
                                      const isCert = sVer?.status === "verified_certificate";
                                      const isTest = sVer?.status === "verified_ai_test";
                                      const isFailed = sVer?.status === "learning_recommended";

                                      return (
                                        <button
                                          key={skill}
                                          type="button"
                                          onClick={() => {
                                            setSelectedSkillDropdown(skill);
                                            setIsSkillDropdownOpen(false);
                                            setAiTestMode("idle");
                                            setAiTestResult(null);
                                          }}
                                          className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all ${
                                            activeDropdownSkill === skill
                                              ? "bg-blue-600/30 text-blue-300 font-bold border border-blue-500/30"
                                              : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                                          }`}
                                        >
                                          <span className="capitalize">{skill}</span>
                                          {isCert && (
                                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                              Cert Verified 📜
                                            </span>
                                          )}
                                          {isTest && (
                                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                              AI Verified ✅
                                            </span>
                                          )}
                                          {isFailed && (
                                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                              Needs 70%+ ⚠️
                                            </span>
                                          )}
                                          {!isCert && !isTest && !isFailed && (
                                            <span className="text-[9px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                                              Unverified 🛡️
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Active Skill Summary Card */}
                              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Selected Skill</span>
                                  {(() => {
                                    if (activeDropdownSkill === "ALL_SKILLS") {
                                      return <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Multi-Skill Evaluation</span>;
                                    }
                                    const sVer = skillVerifications[activeDropdownSkill.toLowerCase()];
                                    if (sVer?.status === "verified_ai_test") return <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Verified ({sVer.score}/{sVer.total || 3}) ✅</span>;
                                    if (sVer?.status === "verified_certificate") return <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Verified by Certificate 📜</span>;
                                    if (sVer?.status === "learning_recommended") return <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Score &lt; 70% ⚠️</span>;
                                    return <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Not Verified 🛡️</span>;
                                  })()}
                                </div>

                                <div>
                                  <h3 className="text-base font-black text-white capitalize">
                                    {activeDropdownSkill === "ALL_SKILLS" ? "All Identified Skills" : activeDropdownSkill}
                                  </h3>
                                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                    {activeDropdownSkill === "ALL_SKILLS"
                                      ? "Evaluates all identified skills together with min 3 questions each."
                                      : "Upload an official certificate or start the interactive AI assessment test on the right."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 italic py-6 text-center">No indexed skills found in the parsed text.</p>
                          )}
                        </div>

                        {/* Action Buttons Pinned to Bottom */}
                        {currentSkillsAndSuggestions.skills.length > 0 && (
                          <div className="flex flex-col gap-2 pt-3 border-t border-slate-800/80">
                            {activeDropdownSkill !== "ALL_SKILLS" && (
                              <button
                                type="button"
                                onClick={() => setSelectedSkillToVerify(activeDropdownSkill)}
                                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700/60 cursor-pointer shadow-sm"
                              >
                                <span>📜</span> Upload Certificate
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: AI Test Section */}
                      <div className="lg:col-span-7 rounded-2xl bg-slate-900/40 border border-slate-850 p-6 flex flex-col justify-between h-full space-y-5">
                        <div className="space-y-4">
                          {/* Section Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                                  AI Assessment Section
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                  70%+ Required to Pass
                                </span>
                              </div>
                              <h3 className="text-base font-extrabold text-white mt-1.5 flex items-center gap-2">
                                <span>🧠</span> AI Skill Assessment Test
                              </h3>
                            </div>

                            {aiTestMode !== "idle" && (
                              <button
                                type="button"
                                onClick={handleResetInlineAITest}
                                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 transition-all border border-slate-700/50 cursor-pointer self-start sm:self-auto"
                              >
                                Reset Test
                              </button>
                            )}
                          </div>

                          {/* Error Alert */}
                          {aiTestError && (
                            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-300 flex items-center gap-2">
                              <span>⚠️</span> {aiTestError}
                            </div>
                          )}

                          {/* STATE 1: IDLE */}
                          {aiTestMode === "idle" && (
                            <div className="space-y-4 py-1">
                              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">🎯</span>
                                  <h4 className="text-sm font-bold text-white">
                                    Assessment for:{" "}
                                    <span className="text-blue-400">
                                      All {currentSkillsAndSuggestions.skills.length} Identified Skills
                                    </span>
                                  </h4>
                                </div>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                  This automated test evaluates <strong className="text-white font-bold">all your identified skills together</strong> with a minimum of 3 questions per skill. You must achieve <strong className="text-emerald-400 font-bold">70% or above</strong> on the combined assessment to verify your skill proficiency and earn verified badges on your profile.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* STATE 2: LOADING */}
                          {aiTestMode === "loading" && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                              <span className="w-10 h-10 rounded-full border-3 border-violet-500/20 border-t-violet-500 animate-spin"></span>
                              <div className="text-center space-y-1">
                                <p className="text-xs font-bold text-white">
                                  Generating AI Assessment for {aiTestTargetSkill === "ALL_SKILLS" ? "All Skills" : aiTestTargetSkill}...
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  Curating at least 3 high-quality technical questions per skill...
                                </p>
                              </div>
                            </div>
                          )}

                          {/* STATE 3: QUIZ IN-PROGRESS */}
                          {aiTestMode === "quiz" && aiTestQuestions.length > 0 && (
                            <div className="space-y-4 animate-fade-in">
                              {/* Quiz Header Bar */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-300">
                                    Question {aiTestCurrentIdx + 1} of {aiTestQuestions.length}
                                  </span>
                                  <span className="font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                    Skill: {aiTestQuestions[aiTestCurrentIdx]?.skill || aiTestTargetSkill}
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-300"
                                    style={{
                                      width: `${((aiTestCurrentIdx + 1) / aiTestQuestions.length) * 100}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Question Card */}
                              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                                <h4 className="text-sm font-bold text-white leading-relaxed">
                                  {aiTestQuestions[aiTestCurrentIdx].question}
                                </h4>

                                {/* MCQ Options */}
                                <div className="space-y-2">
                                  {aiTestQuestions[aiTestCurrentIdx].options.map((opt, optIdx) => {
                                    const isSelected = aiTestSelectedAnswers[aiTestCurrentIdx] === optIdx;
                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        onClick={() => {
                                          setAiTestSelectedAnswers((prev) => ({
                                            ...prev,
                                            [aiTestCurrentIdx]: optIdx,
                                          }));
                                        }}
                                        className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-3 cursor-pointer ${
                                          isSelected
                                            ? "bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/10"
                                            : "bg-slate-900/60 border-slate-800/90 text-slate-300 hover:bg-slate-850 hover:border-slate-700"
                                        }`}
                                      >
                                        <span
                                          className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                                            isSelected
                                              ? "border-blue-400 bg-blue-500 text-white"
                                              : "border-slate-700 bg-slate-800 text-slate-400"
                                          }`}
                                        >
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span className="leading-snug">{opt}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Quiz Footer Navigation */}
                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => setAiTestCurrentIdx((prev) => Math.max(0, prev - 1))}
                                  disabled={aiTestCurrentIdx === 0}
                                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-300 disabled:opacity-40 transition-all cursor-pointer"
                                >
                                  ← Previous
                                </button>

                                <span className="text-[11px] text-slate-400 font-medium">
                                  Answered: {Object.keys(aiTestSelectedAnswers).length} / {aiTestQuestions.length}
                                </span>

                                {aiTestCurrentIdx < aiTestQuestions.length - 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => setAiTestCurrentIdx((prev) => prev + 1)}
                                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all cursor-pointer"
                                  >
                                    Next →
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleSubmitInlineAITest}
                                    disabled={aiTestSubmitting}
                                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-extrabold text-white transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-60"
                                  >
                                    {aiTestSubmitting ? "Scoring..." : "Submit Test ✓"}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {/* STATE 4: RESULT SCREEN */}
                          {aiTestMode === "result" && aiTestResult && (
                            <div className="space-y-4 animate-fade-in py-1">
                              {aiTestResult.passed ? (
                                /* PASSING: Score >= 70% */
                                <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-3.5">
                                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-3xl text-emerald-400 shadow-lg shadow-emerald-500/20">
                                    ✅
                                  </div>
                                  <div>
                                    <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                      Passed &amp; Skill Verified (70%+ Achieved)
                                    </span>
                                    <h3 className="text-2xl font-black text-white mt-2">
                                      {aiTestResult.score} / {aiTestResult.total} ({aiTestResult.percentage}%)
                                    </h3>
                                    <p className="text-xs font-semibold text-emerald-300 mt-1 max-w-md mx-auto">
                                      Great work! You scored {aiTestResult.percentage}% (requirement: 70%+). Your proficiency in <strong className="text-white font-bold">{aiTestResult.skill_name}</strong> has been officially verified.
                                    </p>
                                  </div>

                                  <div className="pt-2 flex justify-center gap-3">
                                    <button
                                      type="button"
                                      onClick={handleResetInlineAITest}
                                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                                    >
                                      Take Another Test
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* FAILING: Score < 70% */
                                <div className="space-y-4">
                                  <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-5 text-center space-y-2">
                                    <span className="text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                      Score Below 70% • Not Verified
                                    </span>
                                    <h3 className="text-2xl font-black text-rose-400 mt-1">
                                      {aiTestResult.score} / {aiTestResult.total} ({aiTestResult.percentage}%)
                                    </h3>
                                    <p className="text-xs font-semibold text-rose-300 max-w-md mx-auto leading-relaxed">
                                      You scored {aiTestResult.percentage}%. A minimum of 70% is required to verify this skill. Please review the suggested resources below and try again.
                                    </p>
                                  </div>

                                  {/* Learning Resources */}
                                  {aiTestResult.learning_resources && aiTestResult.learning_resources.length > 0 && (
                                    <div className="space-y-2.5">
                                      <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <span>📚</span> Recommended Learning Resources
                                      </h5>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {aiTestResult.learning_resources.map((res: any, idx: number) => (
                                          <div
                                            key={idx}
                                            className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-2 hover:border-slate-700 transition-all"
                                          >
                                            <div>
                                              <span className="text-xs font-bold text-white block">{res.title}</span>
                                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                                {res.type} • {res.difficulty}
                                              </span>
                                            </div>
                                            <a
                                              href={res.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                                            >
                                              Open Resource ↗
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="pt-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleStartInlineAITest("ALL_SKILLS")}
                                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                                    >
                                      🔁 Retake Full Skills Test
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Start Button Pinned to Bottom for Idle State */}
                        {aiTestMode === "idle" && (
                          <div className="pt-3 border-t border-slate-800/80">
                            <button
                              type="button"
                              onClick={() => handleStartInlineAITest("ALL_SKILLS")}
                              disabled={currentSkillsAndSuggestions.skills.length === 0}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                              Start Full Assessment
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. HORIZONTAL ATS SUGGESTIONS (BELOW SKILLS & AI TEST) */}
                    <div className="rounded-2xl bg-slate-900/40 border border-amber-500/20 p-5 mt-6">
                      <div className="flex items-center justify-between mb-3.5">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-amber-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 5.25h.008v-.008H12v.008ZM12 13V9.75m0 3.25h.008v-.008H12v.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span>ATS Suggestions ({currentSkillsAndSuggestions.suggestions.length})</span>
                        </h4>
                        <span className="text-[10px] font-bold text-amber-400/90 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                          Optimization Recommendations
                        </span>
                      </div>

                      {currentSkillsAndSuggestions.suggestions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {currentSkillsAndSuggestions.suggestions.map((sug, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition-all text-xs text-slate-300 leading-relaxed"
                            >
                              <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0 shadow-sm shadow-amber-400/50"></span>
                              <span>{sug}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 py-1">
                          <span>✨</span> Excellent parser rating! No critical suggestions needed.
                        </p>
                      )}
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
                            {new Date(item.uploaded_at).toLocaleDateString()}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Form Input fields */}
              <div className="flex flex-col h-full">
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Selected Resume</span>
                        {resumeSelecting && (
                          <span className="text-[11px] text-blue-400 font-normal flex items-center gap-1.5 lowercase">
                            <span className="w-3 h-3 rounded-full border border-blue-400/30 border-t-blue-400 animate-spin"></span>
                            Loading...
                          </span>
                        )}
                      </label>

                      {((history && history.length > 0) || (recruiterResumes && recruiterResumes.length > 0)) ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <select
                              value={selectedResume?.id || ""}
                              onChange={async (e) => {
                                const rId = Number(e.target.value);
                                if (rId) {
                                  setResumeSelecting(true);
                                  await loadResumeDetails(rId, false);
                                  setResumeSelecting(false);
                                } else {
                                  setSelectedResume(null);
                                  setJobMatchResult("");
                                }
                              }}
                              disabled={resumeSelecting}
                              className="w-full bg-slate-950/70 rounded-xl border border-slate-800 px-3.5 py-2.5 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer pr-10 font-medium disabled:opacity-50"
                            >
                              <option value="" disabled={Boolean(selectedResume)}>
                                -- Select an uploaded resume ({((history && history.length > 0) ? history : recruiterResumes).length} available) --
                              </option>
                              {((history && history.length > 0) ? history : recruiterResumes).map((item: any) => (
                                <option key={item.id} value={item.id} className="bg-slate-900 text-white py-1">
                                  {item.file_name || item.user_name || `Resume #${item.id}`} {item.ats_score !== null && item.ats_score !== undefined ? ` • ${item.ats_score}% ATS` : ""}
                                </option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                              </svg>
                            </div>
                          </div>

                          {selectedResume && (
                            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs animate-fade-in">
                              <div className="flex items-center gap-2 truncate mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 text-blue-400 flex-shrink-0">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                                <span className="font-bold text-white truncate">{selectedResume.file_name}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 border ${
                                effectiveAtsScore >= 70
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : effectiveAtsScore > 0
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              }`}>
                                {effectiveAtsScore}% ATS
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/15 text-xs text-red-400 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            <span>No resume uploaded yet.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab("upload")}
                            className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-md text-[11px] font-semibold transition-colors"
                          >
                            Upload Now
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                        Paste Job Description
                      </label>
                      <textarea
                        rows={10}
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the target job description (responsibilities, technical requirements, skills list) here..."
                        className="w-full flex-1 bg-slate-950/60 rounded-xl border border-slate-800 p-4 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans leading-relaxed min-h-[220px]"
                        required
                      />
                    </div>
                  </div>

                  <button
                    onClick={runJobMatching}
                    disabled={!selectedResume || !jobDescription.trim() || matchLoading || resumeSelecting}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 font-bold text-xs text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 mt-3"
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
              <div className="flex flex-col h-full">
                <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex-1 flex flex-col justify-between">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        Alignment Scoring Analysis
                      </h3>
                      {jobMatchResult && !matchLoading && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                          Analysis Complete
                        </span>
                      )}
                    </div>

                    {matchLoading && (
                      <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3">
                        <span className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></span>
                        <span className="text-xs text-slate-400 font-medium">Gemini model calculating overlap indexes...</span>
                      </div>
                    )}

                    {jobMatchResult && !matchLoading && (
                      <div className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono max-h-[500px] overflow-y-auto">
                        {jobMatchResult}
                      </div>
                    )}

                    {!jobMatchResult && !matchLoading && (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800/70 rounded-xl bg-slate-950/20 my-auto min-h-[280px]">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3 shadow-inner">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-slate-300 mb-1">
                          Ready for Match Analysis
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                          Select an uploaded resume from the dropdown, paste the job description on the left, and submit compliance check.
                        </p>
                      </div>
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
              <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                AI Career Roadmap
                {history.length > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                    {history.length} {history.length === 1 ? "Profile" : "Profiles"} Available
                  </span>
                )}
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm">
                Choose any of your uploaded resumes to generate a personalized, step-by-step career path outline.
              </p>
            </div>

            {history.length > 0 || selectedResume ? (
              <div className="space-y-6">
                {/* 1. RESUME SELECTOR CARD */}
                <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        Select Resume to Generate Career Roadmap
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Switch between any of your uploaded resumes to map specific milestones.</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Selected: <span className="text-white font-bold">{selectedResume?.file_name || history[0]?.file_name}</span>
                    </span>
                  </div>

                  {/* Dropdown Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-2">
                      <select
                        value={selectedResume?.id || (history[0]?.id || "")}
                        onChange={(e) => handleSelectResumeForRoadmap(Number(e.target.value))}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700/80 px-4 py-3 text-xs font-semibold text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        {history.map((item) => (
                          <option key={item.id} value={item.id}>
                            📄 {item.file_name} — ATS: {item.ats_score ?? 0}% (Scanned {new Date(item.uploaded_at).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => generateRoadmap()}
                      disabled={roadmapLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-3 text-xs font-bold text-white hover:from-blue-500 hover:to-violet-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {roadmapLoading ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                          Generating Career Path...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                          </svg>
                          Generate Step-by-Step Path
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quick Profile Cards Grid */}
                  {history.length > 1 && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">All Uploaded Profiles ({history.length}):</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {history.map((item) => {
                          const isCurrent = (selectedResume?.id || history[0]?.id) === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectResumeForRoadmap(item.id)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isCurrent
                                  ? "bg-blue-600/15 border-blue-500/50 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/40"
                                  : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-bold truncate ${isCurrent ? "text-blue-300" : "text-white"}`}>
                                  {item.file_name}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {new Date(item.uploaded_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  (item.ats_score ?? 0) >= 70
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : (item.ats_score ?? 0) >= 40
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`}>
                                  {item.ats_score ?? 0}%
                                </span>
                                {isCurrent && (
                                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. LOADING STATE */}
                {roadmapLoading && (
                  <div className="rounded-2xl bg-slate-900/40 border border-slate-850 p-16 flex flex-col items-center justify-center space-y-4">
                    <span className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></span>
                    <p className="text-sm font-bold text-white">Mapping Personalized Career Pathway...</p>
                    <span className="text-xs text-slate-500 font-semibold max-w-md text-center">
                      Gemini AI is analyzing {selectedResume?.file_name || history[0]?.file_name} to generate tailored milestones, skill upgrades, certifications, and industry projects.
                    </span>
                  </div>
                )}

                {/* 3. ROADMAP CONTENT */}
                {careerRoadmap && !roadmapLoading && (
                  <div className="rounded-2xl bg-slate-900/40 border border-slate-800 p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25H5.625A2.25 2.25 0 0 1 3.375 18V6.125c0-.621.504-1.125 1.125-1.125H9.75M8.25 21h8.25" />
                        </svg>
                        Career Pathway Blueprint: <span className="text-blue-400">{selectedResume?.file_name || history[0]?.file_name}</span>
                      </h3>
                      <button
                        onClick={() => navigator.clipboard.writeText(careerRoadmap)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        📋 Copy Blueprint
                      </button>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-850/80 rounded-xl p-6 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                      {careerRoadmap}
                    </div>
                  </div>
                )}

                {/* 4. READY STATE */}
                {!careerRoadmap && !roadmapLoading && (
                  <div className="rounded-2xl bg-slate-900/10 border border-slate-800/40 border-dashed p-16 flex flex-col items-center justify-center text-slate-500 text-center">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </div>
                    <p className="font-semibold text-sm text-white">Active Profile: {selectedResume?.file_name || history[0]?.file_name}</p>
                    <p className="text-xs mt-1 text-slate-400">Click <b>"Generate Step-by-Step Path"</b> above to construct your customized AI Career Roadmap.</p>
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
                <p className="font-bold text-sm text-slate-400">No resumes uploaded yet</p>
                <p className="text-xs text-slate-500 mt-1">Upload a resume in the <b>Upload & Scan</b> section first to get a personalized roadmap.</p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Go to Upload Resume
                </button>
              </div>
            )}
          </div>
        )}

        {/* 8. RECRUITER TALENT HUB */}
        {activeTab === "recruiter" && (user?.role === "admin" || user?.role === "recruiter") && (
          <div className="space-y-8 animate-fade-in">
            {/* Header with Sub-Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    Recruiter Talent Hub
                  </h1>
                  <span className="text-[11px] px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-blue-300 font-bold border border-blue-500/30 uppercase tracking-wider">
                    {user?.role} Portal
                  </span>
                </div>
                <p className="text-slate-400 mt-1 text-sm">
                  Smart candidate sourcing: Search by job role, filter by verified skills, and review priority-matched talent.
                </p>
              </div>

              {/* Sub-Tabs Selector */}
              <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setRecruiterSubTab("search")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    recruiterSubTab === "search"
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  Talent Discovery ({filteredCandidates.length})
                </button>

                <button
                  onClick={() => setRecruiterSubTab("shortlist")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    recruiterSubTab === "shortlist"
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                  Shortlisted ({Object.keys(shortlistedMap).length})
                </button>

                <button
                  onClick={() => setRecruiterSubTab("analytics")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    recruiterSubTab === "analytics"
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                  Pool Analytics
                </button>
              </div>
            </div>

            {/* SUBTAB 1: TALENT DISCOVERY */}
            {recruiterSubTab === "search" && (
              <div className="space-y-6">
                {/* Search & Preset Roles Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl space-y-5">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Target Job Role Sourcing
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchRole}
                          onChange={(e) => setSearchRole(e.target.value)}
                          placeholder="e.g. Full Stack Developer, Python Engineer, Java Developer..."
                          className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-all shadow-inner"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-400 absolute left-3.5 top-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                        </svg>
                      </div>
                    </div>

                    <div className="w-full md:w-auto">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Add Required Skill Tag
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSkillInput}
                          onChange={(e) => setCustomSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && customSkillInput.trim()) {
                              const s = customSkillInput.trim().toLowerCase();
                              if (!searchSkills.includes(s)) {
                                setSearchSkills([...searchSkills, s]);
                              }
                              setCustomSkillInput("");
                            }
                          }}
                          placeholder="e.g. spring boot, aws, docker"
                          className="px-3.5 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-all text-xs"
                        />
                        <button
                          onClick={() => {
                            if (customSkillInput.trim()) {
                              const s = customSkillInput.trim().toLowerCase();
                              if (!searchSkills.includes(s)) {
                                setSearchSkills([...searchSkills, s]);
                              }
                              setCustomSkillInput("");
                            }
                          }}
                          className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preset Role Quick-Buttons */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      Popular Roles Preset
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {RECRUITER_PRESET_ROLES.map((preset) => {
                        const isSelected = searchRole.toLowerCase() === preset.title.toLowerCase();
                        return (
                          <button
                            key={preset.title}
                            onClick={() => {
                              setSearchRole(preset.title);
                              setSearchSkills(preset.skills);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              isSelected
                                ? "bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/20"
                                : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60"
                            }`}
                          >
                            <span className="mr-1">{preset.icon}</span>
                            {preset.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Skill Tags */}
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Active Required Skills ({searchSkills.length})
                      </div>
                      {searchSkills.length > 0 && (
                        <button
                          onClick={() => setSearchSkills([])}
                          className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                        >
                          Clear all skills
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {searchSkills.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">No specific skills required. Showing general pool.</span>
                      ) : (
                        searchSkills.map((sk) => (
                          <span
                            key={sk}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold"
                          >
                            {sk}
                            <button
                              onClick={() => setSearchSkills(searchSkills.filter((s) => s !== sk))}
                              className="hover:text-red-300 transition-colors ml-0.5 text-slate-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Sourcing Toolbar: Filters & Sorting */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Left Filters */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Min ATS Filter */}
                    <div className="flex items-center gap-1 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-semibold">Min ATS:</span>
                      <select
                        value={minAtsFilter}
                        onChange={(e) => setMinAtsFilter(Number(e.target.value))}
                        className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                      >
                        <option value={0} className="bg-slate-900">Any ATS</option>
                        <option value={50} className="bg-slate-900">50%+</option>
                        <option value={70} className="bg-slate-900">70%+ (High)</option>
                        <option value={80} className="bg-slate-900">80%+ (Top Tier)</option>
                      </select>
                    </div>

                    {/* Verified Only Filter */}
                    <button
                      onClick={() => setVerifiedOnlyFilter(!verifiedOnlyFilter)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                        verifiedOnlyFilter
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10"
                          : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                      </svg>
                      Verified Skills Only
                    </button>

                    {/* Experience Filter */}
                    <div className="flex items-center gap-1 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-semibold">Exp:</span>
                      <select
                        value={experienceFilter}
                        onChange={(e) => setExperienceFilter(e.target.value)}
                        className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-slate-900">All Experience</option>
                        <option value="fresher" className="bg-slate-900">Freshers (0 Yrs)</option>
                        <option value="1-2" className="bg-slate-900">1 - 2 Years</option>
                        <option value="3+" className="bg-slate-900">3+ Years</option>
                      </select>
                    </div>

                    {/* Location input */}
                    <input
                      type="text"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="Filter by city..."
                      className="bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-32 md:w-36"
                    />
                  </div>

                  {/* Right Sorting & View Mode */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-semibold">Sort By:</span>
                      <select
                        value={recruiterSortBy}
                        onChange={(e: any) => setRecruiterSortBy(e.target.value)}
                        className="bg-transparent text-blue-400 font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="priority" className="bg-slate-900">Priority Match (Smart)</option>
                        <option value="ats" className="bg-slate-900">ATS Score</option>
                        <option value="verified" className="bg-slate-900">Verified Skills Count</option>
                        <option value="newest" className="bg-slate-900">Newest Upload</option>
                      </select>
                    </div>

                    {/* View mode toggle */}
                    <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setRecruiterViewMode("grid")}
                        className={`p-1.5 rounded-lg transition-all ${
                          recruiterViewMode === "grid" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                        title="Grid Cards"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setRecruiterViewMode("table")}
                        className={`p-1.5 rounded-lg transition-all ${
                          recruiterViewMode === "table" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                        title="Dense Table"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Candidate Results Render */}
                {recruiterLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center space-y-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                    <span className="w-9 h-9 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></span>
                    <span className="text-xs text-slate-400 font-semibold">Indexing talent pool & ranking candidate profiles...</span>
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3 rounded-2xl bg-slate-900/40 border border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-300">No candidates match your current search filters</p>
                    <p className="text-xs text-slate-500">Try adjusting required skills, lowering min ATS, or relaxing the verified only toggle.</p>
                  </div>
                ) : recruiterViewMode === "grid" ? (
                  /* GRID CARDS VIEW */
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredCandidates.map((candidate) => {
                      const match = candidate.match;
                      const isShortlisted = !!shortlistedMap[candidate.id];

                      return (
                        <div
                          key={candidate.id}
                          className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative group hover:border-slate-700 bg-slate-900/70 backdrop-blur-md shadow-lg ${
                            match.tier === "top"
                              ? "border-emerald-500/40 hover:shadow-emerald-500/5"
                              : match.tier === "high"
                              ? "border-blue-500/30 hover:shadow-blue-500/5"
                              : "border-slate-800"
                          }`}
                        >
                          {/* Priority Ribbon / Header */}
                          <div className="p-5 pb-3">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              {/* Match Circle & Tier */}
                              <div className="flex items-center gap-3">
                                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold border shadow-inner ${
                                  match.tier === "top"
                                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                                    : match.tier === "high"
                                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                                    : match.tier === "moderate"
                                    ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                                    : "bg-slate-800 border-slate-700 text-slate-400"
                                }`}>
                                  <span className="text-lg leading-tight">{match.score}%</span>
                                  <span className="text-[8px] uppercase tracking-tighter opacity-80">Match</span>
                                </div>

                                <div>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                    match.tier === "top"
                                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                      : match.tier === "high"
                                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                      : match.tier === "moderate"
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                      : "bg-slate-800 text-slate-400 border-slate-700"
                                  }`}>
                                    {match.tier === "top" ? "★ Top Priority" : match.tier === "high" ? "High Match" : match.tier === "moderate" ? "Moderate Match" : "Partial Fit"}
                                  </span>
                                  <h3 className="text-base font-extrabold text-white mt-1 group-hover:text-blue-400 transition-colors">
                                    {candidate.candidate_name || "Anonymous Candidate"}
                                  </h3>
                                  <p className="text-xs text-slate-400">{candidate.candidate_email}</p>
                                </div>
                              </div>

                              {/* Bookmark / Shortlist button */}
                              <button
                                onClick={() => toggleShortlist(candidate.id)}
                                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                  isShortlisted
                                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                                title={isShortlisted ? "Remove from Shortlist" : "Add to Shortlist"}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isShortlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                </svg>
                              </button>
                            </div>

                            {/* Candidate Meta Info */}
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                              <div>
                                <span className="text-slate-500 block text-[10px]">Experience:</span>
                                <span className="font-semibold text-slate-200">{candidate.candidate_experience || "Fresher"}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Location:</span>
                                <span className="font-semibold text-slate-200 truncate block">
                                  {candidate.candidate_city ? `${candidate.candidate_city}, ${candidate.candidate_state || 'IN'}` : "Not specified"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Education:</span>
                                <span className="font-semibold text-slate-200 truncate block">
                                  {candidate.candidate_degree ? `${candidate.candidate_degree} (${candidate.candidate_branch || ''})` : "Graduated"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">ATS Score:</span>
                                <span className={`font-bold ${
                                  (candidate.ats_score ?? 0) >= 70 ? "text-emerald-400" : (candidate.ats_score ?? 0) >= 50 ? "text-amber-400" : "text-red-400"
                                }`}>
                                  {candidate.ats_score ?? 0}%
                                </span>
                              </div>
                            </div>

                            {/* Verified Skills Section */}
                            <div className="mb-3">
                              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-emerald-400">
                                  <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                                </svg>
                                Verified Credentials ({match.verifiedCount})
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {match.verifiedList.length > 0 ? (
                                  match.verifiedList.map((v: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold"
                                    >
                                      ✓ {v.skill_name}
                                      {v.score ? ` (${v.score}/10)` : " (Cert)"}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-slate-500 italic">No certificates or AI test proofs attached yet</span>
                                )}
                              </div>
                            </div>

                            {/* Matched Required Skills */}
                            {searchSkills.length > 0 && (
                              <div className="mb-2">
                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                                  Role Skill Fit ({match.matchedSkills.length}/{searchSkills.length})
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {match.matchedSkills.map((sk: string) => (
                                    <span key={sk} className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-semibold">
                                      ✓ {sk}
                                    </span>
                                  ))}
                                  {match.missingSkills.map((sk: string) => (
                                    <span key={sk} className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 text-[10px] line-through decoration-slate-600">
                                      {sk}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Footer */}
                          <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setDossierCandidate(candidate)}
                              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                              </svg>
                              Inspect Dossier
                            </button>

                            <button
                              onClick={() => handleExportReport(candidate.id, candidate.file_name)}
                              className="py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Export Evaluation Report"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              PDF
                            </button>

                            {candidate.candidate_email && (
                              <a
                                href={`mailto:${candidate.candidate_email}?subject=Job Opportunity: ${encodeURIComponent(searchRole)}&body=Hi ${encodeURIComponent(candidate.candidate_name || 'Candidate')},%0D%0A%0D%0AWe reviewed your profile and resume on our AI Talent Hub for the ${encodeURIComponent(searchRole)} position and would love to connect with you.`}
                                className="py-2 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Send Email Inquiry"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* TABLE VIEW */
                  <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-950/70">
                            <th className="px-5 py-4">Priority Fit</th>
                            <th className="px-5 py-4">Candidate</th>
                            <th className="px-5 py-4">Exp & Location</th>
                            <th className="px-5 py-4">Verified Skills</th>
                            <th className="px-5 py-4">ATS Score</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-300 text-xs font-medium">
                          {filteredCandidates.map((candidate) => {
                            const match = candidate.match;
                            const isShortlisted = !!shortlistedMap[candidate.id];

                            return (
                              <tr key={candidate.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2.5">
                                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border ${
                                      match.tier === "top"
                                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                                        : match.tier === "high"
                                        ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                                        : "bg-slate-800 border-slate-700 text-slate-400"
                                    }`}>
                                      {match.score}%
                                    </span>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                      match.tier === "top"
                                        ? "bg-emerald-500/20 text-emerald-300"
                                        : match.tier === "high"
                                        ? "bg-blue-500/20 text-blue-300"
                                        : "bg-slate-800 text-slate-400"
                                    }`}>
                                      {match.tier}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="font-bold text-white text-sm">{candidate.candidate_name || "Candidate"}</div>
                                  <div className="text-[11px] text-slate-500">{candidate.candidate_email}</div>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="font-semibold text-slate-200">{candidate.candidate_experience || "Fresher"}</div>
                                  <div className="text-[11px] text-slate-500">{candidate.candidate_city || "India"}</div>
                                </td>

                                <td className="px-5 py-4 max-w-xs">
                                  <div className="flex flex-wrap gap-1">
                                    {match.verifiedList.length > 0 ? (
                                      match.verifiedList.slice(0, 3).map((v: any, idx: number) => (
                                        <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                                          ✓ {v.skill_name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[11px] text-slate-500 italic">None verified</span>
                                    )}
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                                    (candidate.ats_score ?? 0) >= 70
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : (candidate.ats_score ?? 0) >= 50
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                      : "bg-red-500/10 text-red-400 border-red-500/20"
                                  }`}>
                                    {candidate.ats_score ?? 0}%
                                  </span>
                                </td>

                                <td className="px-5 py-4 text-right space-x-2">
                                  <button
                                    onClick={() => toggleShortlist(candidate.id)}
                                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                      isShortlisted
                                        ? "bg-blue-600 text-white border-blue-500"
                                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    {isShortlisted ? "Shortlisted" : "+ Shortlist"}
                                  </button>

                                  <button
                                    onClick={() => setDossierCandidate(candidate)}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
                                  >
                                    Inspect
                                  </button>

                                  <button
                                    onClick={() => handleExportReport(candidate.id, candidate.file_name)}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                                  >
                                    PDF
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 2: SHORTLIST MANAGEMENT */}
            {recruiterSubTab === "shortlist" && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white">Shortlisted Candidates Pipeline</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage recruitment stages, track progress, and export shortlisted talent data to CSV.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={exportShortlistReport}
                      disabled={Object.keys(shortlistedMap).length === 0}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Export Shortlist CSV
                    </button>
                  </div>
                </div>

                {Object.keys(shortlistedMap).length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3 rounded-2xl bg-slate-900/40 border border-slate-800">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-300">No candidates shortlisted yet</p>
                    <p className="text-xs text-slate-500">Go back to Talent Discovery and click "+ Shortlist" on candidates to track them here.</p>
                    <button
                      onClick={() => setRecruiterSubTab("search")}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Find Candidates
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-950/70">
                            <th className="px-5 py-4">Candidate</th>
                            <th className="px-5 py-4">Contact</th>
                            <th className="px-5 py-4">Current Stage</th>
                            <th className="px-5 py-4">Verified Skills</th>
                            <th className="px-5 py-4">Shortlisted Date</th>
                            <th className="px-5 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-300 text-xs font-medium">
                          {recruiterResumes
                            .filter((c) => shortlistedMap[c.id])
                            .map((candidate) => {
                              const itemState = shortlistedMap[candidate.id];
                              const verifiedList = candidate.verified_skills || [];

                              return (
                                <tr key={candidate.id} className="hover:bg-slate-800/40 transition-colors">
                                  <td className="px-5 py-4">
                                    <div className="font-bold text-white text-sm">{candidate.candidate_name || "Candidate"}</div>
                                    <div className="text-[11px] text-blue-400 font-semibold">{candidate.candidate_role || "Applicant"}</div>
                                  </td>

                                  <td className="px-5 py-4">
                                    <div className="text-slate-200">{candidate.candidate_email}</div>
                                    <div className="text-[11px] text-slate-500">{candidate.candidate_phone || "No phone"}</div>
                                  </td>

                                  <td className="px-5 py-4">
                                    <select
                                      value={itemState.status || "Shortlisted"}
                                      onChange={(e) => updateCandidateStatus(candidate.id, e.target.value)}
                                      className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-white font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                                    >
                                      <option value="Shortlisted">Shortlisted</option>
                                      <option value="Phone Screen">Phone Screen</option>
                                      <option value="Interview Scheduled">Interview Scheduled</option>
                                      <option value="Technical Round">Technical Round</option>
                                      <option value="Offer Extended">Offer Extended</option>
                                      <option value="Rejected">Rejected</option>
                                    </select>
                                  </td>

                                  <td className="px-5 py-4">
                                    <div className="flex flex-wrap gap-1">
                                      {verifiedList.length > 0 ? (
                                        verifiedList.slice(0, 3).map((v: any, idx: number) => (
                                          <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                                            ✓ {v.skill_name}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-[11px] text-slate-500 italic">None</span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="px-5 py-4 text-slate-400">
                                    {new Date(itemState.date).toLocaleDateString()}
                                  </td>

                                  <td className="px-5 py-4 text-right space-x-2">
                                    <button
                                      onClick={() => setDossierCandidate(candidate)}
                                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
                                    >
                                      Inspect
                                    </button>
                                    <button
                                      onClick={() => toggleShortlist(candidate.id)}
                                      className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all"
                                      title="Remove from shortlist"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 3: TALENT POOL ANALYTICS */}
            {recruiterSubTab === "analytics" && (
              <div className="space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Talent In Pool</span>
                    <div className="text-3xl font-black text-white mt-1">{recruiterResumes.length}</div>
                    <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">Globally indexed resumes</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average ATS Score</span>
                    <div className="text-3xl font-black text-blue-400 mt-1">
                      {recruiterResumes.length > 0
                        ? Math.round(recruiterResumes.reduce((acc, c) => acc + (c.ats_score || 0), 0) / recruiterResumes.length)
                        : 0}%
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Structural compliance index</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Verified Credentials</span>
                    <div className="text-3xl font-black text-emerald-400 mt-1">
                      {recruiterResumes.filter((c) => (c.verified_skills || []).length > 0).length}
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                      {recruiterResumes.length > 0
                        ? Math.round((recruiterResumes.filter((c) => (c.verified_skills || []).length > 0).length / recruiterResumes.length) * 100)
                        : 0}% of talent verified
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shortlisted Pipeline</span>
                    <div className="text-3xl font-black text-violet-400 mt-1">
                      {Object.keys(shortlistedMap).length}
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Candidates under active review</span>
                  </div>
                </div>

                {/* Skills Distribution in Talent Pool */}
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h3 className="text-base font-extrabold text-white">Top Technical Skills In Talent Pool</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      "python", "javascript", "react", "node.js", "java", "sql", "docker", "aws", "typescript", "git"
                    ].map((sk) => {
                      const count = recruiterResumes.filter((c) => {
                        const skills = (c.detected_skills || []).map((s: string) => s.toLowerCase());
                        const text = (c.extracted_text || "").toLowerCase();
                        return skills.includes(sk) || text.includes(sk);
                      }).length;
                      const percent = recruiterResumes.length > 0 ? Math.round((count / recruiterResumes.length) * 100) : 0;

                      return (
                        <div key={sk} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-300 capitalize">{sk}</span>
                            <span className="text-blue-400">{count} candidates ({percent}%)</span>
                          </div>
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-violet-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CANDIDATE DOSSIER MODAL */}
            {dossierCandidate && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scale-up">
                  {/* Modal Header */}
                  <div className="p-6 bg-slate-950/70 border-b border-slate-800 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-blue-500/20">
                        {dossierCandidate.candidate_name?.charAt(0)?.toUpperCase() || "C"}
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-white">{dossierCandidate.candidate_name || "Candidate Profile"}</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{dossierCandidate.candidate_email}</span>
                          <span>•</span>
                          <span>{dossierCandidate.candidate_phone || "No phone"}</span>
                          <span>•</span>
                          <span>{dossierCandidate.candidate_city ? `${dossierCandidate.candidate_city}, ${dossierCandidate.candidate_state || 'IN'}` : "Location not provided"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleShortlist(dossierCandidate.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                          shortlistedMap[dossierCandidate.id]
                            ? "bg-blue-600 text-white border-blue-500"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white"
                        }`}
                      >
                        {shortlistedMap[dossierCandidate.id] ? "✓ Shortlisted" : "+ Add to Shortlist"}
                      </button>
                      <button
                        onClick={() => setDossierCandidate(null)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                    {/* Role Match Overview Banner */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-violet-950/30 to-slate-950 border border-blue-800/40 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Target Role Match</span>
                        <div className="text-lg font-extrabold text-white mt-0.5">
                          {searchRole} Fit: {dossierCandidate.match?.score || computeCandidateMatch(dossierCandidate, searchRole, searchSkills).score}%
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">ATS Score</span>
                          <span className="text-sm font-black text-emerald-400">{dossierCandidate.ats_score || 0}%</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">Verified Skills</span>
                          <span className="text-sm font-black text-blue-400">{(dossierCandidate.verified_skills || []).length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
                        <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Education & Background</h4>
                        <p className="text-slate-300"><b>College:</b> {dossierCandidate.candidate_college || "Not specified"}</p>
                        <p className="text-slate-300"><b>Degree:</b> {dossierCandidate.candidate_degree || "Not specified"} ({dossierCandidate.candidate_branch || "Branch"})</p>
                        <p className="text-slate-300"><b>Experience:</b> {dossierCandidate.candidate_experience || "Fresher"}</p>
                        <p className="text-slate-300"><b>Preferred Role:</b> {dossierCandidate.candidate_role || "Software Engineer"}</p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
                        <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Social & Portfolios</h4>
                        {dossierCandidate.candidate_github ? (
                          <p className="text-blue-400 truncate">
                            <a href={dossierCandidate.candidate_github.startsWith("http") ? dossierCandidate.candidate_github : `https://${dossierCandidate.candidate_github}`} target="_blank" rel="noreferrer" className="underline">
                              GitHub: {dossierCandidate.candidate_github}
                            </a>
                          </p>
                        ) : <p className="text-slate-500">GitHub: Not provided</p>}
                        {dossierCandidate.candidate_linkedin ? (
                          <p className="text-blue-400 truncate">
                            <a href={dossierCandidate.candidate_linkedin.startsWith("http") ? dossierCandidate.candidate_linkedin : `https://${dossierCandidate.candidate_linkedin}`} target="_blank" rel="noreferrer" className="underline">
                              LinkedIn: {dossierCandidate.candidate_linkedin}
                            </a>
                          </p>
                        ) : <p className="text-slate-500">LinkedIn: Not provided</p>}
                        {dossierCandidate.candidate_portfolio ? (
                          <p className="text-blue-400 truncate">
                            <a href={dossierCandidate.candidate_portfolio.startsWith("http") ? dossierCandidate.candidate_portfolio : `https://${dossierCandidate.candidate_portfolio}`} target="_blank" rel="noreferrer" className="underline">
                              Portfolio: {dossierCandidate.candidate_portfolio}
                            </a>
                          </p>
                        ) : <p className="text-slate-500">Portfolio: Not provided</p>}
                      </div>
                    </div>

                    {/* Verified Credentials Proofs */}
                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
                      <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-400">
                          <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                        </svg>
                        Skill Verification & Certificate Proofs
                      </h4>
                      {(dossierCandidate.verified_skills || []).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {(dossierCandidate.verified_skills || []).map((v: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                              <div className="font-bold text-emerald-300 text-xs flex items-center justify-between">
                                <span>{v.skill_name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20">Verified</span>
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                Method: {v.verification_type === "certificate" ? "Certificate Upload" : "AI Assessment Test"}
                              </div>
                              {v.score && <div className="text-[10px] text-emerald-400 font-bold">Score: {v.score}/10</div>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">No certificates or verified tests uploaded for this candidate.</p>
                      )}
                    </div>

                    {/* Extracted Resume Text Box */}
                    <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                          Extracted Resume Content ({dossierCandidate.file_name})
                        </h4>
                        <button
                          onClick={() => handleExportReport(dossierCandidate.id, dossierCandidate.file_name)}
                          className="text-blue-400 hover:text-blue-300 underline font-bold"
                        >
                          Download Full PDF
                        </button>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 max-h-56 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                        {dossierCandidate.extracted_text || "No text available."}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setDossierCandidate(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                    >
                      Close Dossier
                    </button>

                    <div className="flex items-center gap-2">
                      {dossierCandidate.candidate_email && (
                        <a
                          href={`mailto:${dossierCandidate.candidate_email}?subject=Interview Invitation: ${encodeURIComponent(searchRole)}&body=Dear ${encodeURIComponent(dossierCandidate.candidate_name || 'Candidate')},%0D%0A%0D%0AWe are impressed by your qualifications for the ${encodeURIComponent(searchRole)} role and would like to schedule a conversation with you.`}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                          Contact Candidate
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  onClick={() => setProfileSubTab("skill_verification")}
                  className={`w-full px-3.5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 ${
                    profileSubTab === "skill_verification"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 font-extrabold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-xs">🛡️</span>
                  Skill Verification
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
                      {(() => {
                        const parsedDob = parseDobParts(profileForm.dob);
                        return (
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
                                  value={parsedDob.day}
                                  onChange={(e) => {
                                    const selectedDay = e.target.value;
                                    const yr = parsedDob.year || "2005";
                                    const mo = parsedDob.month || "01";
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
                                  value={parsedDob.month}
                                  onChange={(e) => {
                                    const selectedMonth = e.target.value;
                                    const yr = parsedDob.year || "2005";
                                    const dy = parsedDob.day || "01";
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
                                  value={parsedDob.year}
                                  onChange={(e) => {
                                    const selectedYear = e.target.value;
                                    const mo = parsedDob.month || "01";
                                    const dy = parsedDob.day || "01";
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
                        );
                      })()}

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
                        <p className="text-xs font-bold text-slate-300 truncate mt-2">{profileStats?.resume_upload_date ? profileStats.resume_upload_date.split(",")[0] : "N/A"}</p>
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

                {/* 🛡️ Skill Verification Panel */}
                {profileSubTab === "skill_verification" && (
                  <div className="rounded-3xl bg-slate-900/70 border border-slate-800/90 p-6 md:p-8 space-y-6 backdrop-blur-xl shadow-xl shadow-black/30 animate-fade-in">
                    <div className="border-b border-slate-800/80 pb-4">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-sm">🛡️</span>
                        Skill Verification Status
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Verify your detected technical skills via Certificate Upload or 10-Question Gemini AI Test
                      </p>
                    </div>

                    {currentSkillsAndSuggestions.skills.length > 0 || Object.keys(skillVerifications).length > 0 ? (
                      <div className="space-y-3">
                        {Array.from(
                          new Set([
                            ...currentSkillsAndSuggestions.skills,
                            ...Object.values(skillVerifications).map((v: any) => v.skill_name),
                          ])
                        ).map((skill) => {
                          const sVer = skillVerifications[skill.toLowerCase()];
                          const isCert = sVer?.status === "verified_certificate";
                          const isTest = sVer?.status === "verified_ai_test";
                          const isFailed = sVer?.status === "learning_recommended";

                          return (
                            <div
                              key={skill}
                              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                            >
                              <div>
                                <h4 className="text-sm font-bold text-white capitalize flex items-center gap-2">
                                  {skill}
                                </h4>
                                {isCert && (
                                  <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                                    <span>Verified by Certificate</span> <span>✅</span>
                                  </p>
                                )}
                                {isTest && (
                                  <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                                    <span>Verified by AI Test ({sVer.score}/10)</span> <span>✅</span>
                                  </p>
                                )}
                                {isFailed && (
                                  <p className="text-xs text-rose-400 font-semibold mt-1 flex items-center gap-1">
                                    <span>Learning Recommended</span> <span>⚠️</span>
                                  </p>
                                )}
                                {!isCert && !isTest && !isFailed && (
                                  <p className="text-xs text-slate-400 font-medium mt-1">Not Verified</p>
                                )}
                              </div>

                              <div className="flex items-center gap-3 self-end md:self-auto">
                                {isCert && (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Verified Certificate
                                  </span>
                                )}
                                {isTest && (
                                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Verified AI Test
                                  </span>
                                )}
                                {isFailed && (
                                  <button
                                    onClick={() => setSelectedSkillToVerify(skill)}
                                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                                  >
                                    Re-Take Test / Verify
                                  </button>
                                )}
                                {!isCert && !isTest && !isFailed && (
                                  <button
                                    onClick={() => setSelectedSkillToVerify(skill)}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>🛡️</span> Verify Skill
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-500 space-y-2">
                        <p className="text-xs italic">Upload a resume to automatically detect and verify your skills.</p>
                      </div>
                    )}
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

      {/* SKILL VERIFICATION MODAL */}
      {selectedSkillToVerify && (
        <SkillVerificationModal
          skillName={selectedSkillToVerify}
          resumeId={selectedResume?.id}
          onClose={() => setSelectedSkillToVerify(null)}
          onVerificationComplete={() => {
            fetchSkillVerifications(selectedResume?.id);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;