import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"user" | "recruiter">("user");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const validateGmail = (emailStr: string) => {
    const cleanEmail = emailStr.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(cleanEmail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!validateGmail(cleanEmail)) {
      setErrorMsg("Only valid @gmail.com email addresses are allowed.");
      return;
    }

    if (!isLogin && !fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Handle Login
        const response = await api.post("/users/login", {
          email: cleanEmail,
          password,
        });

        localStorage.setItem("token", response.data.access_token);
        setSuccessMsg("Welcome back! Redirecting to workspace...");

        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      } else {
        // Handle Registration
        const response = await api.post("/users/register", {
          full_name: fullName.trim(),
          email: cleanEmail,
          password,
          role,
        });

        localStorage.setItem("token", response.data.access_token);
        setSuccessMsg(`Account created as ${role === "recruiter" ? "Recruiter" : "Candidate"}! Redirecting...`);

        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let detailMsg = error.response?.data?.detail;
      if (Array.isArray(detailMsg)) {
        detailMsg = detailMsg.map((err: any) => err.msg).join(", ");
      }
      setErrorMsg(
        detailMsg ||
        error.message ||
        "Authentication failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8 relative overflow-hidden font-sans">
      {/* Dynamic ambient grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none"></div>
      
      {/* Decorative gradient glow elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none"></div>

      {/* Main Container Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/90 backdrop-blur-2xl p-7 sm:p-9 shadow-2xl border border-slate-800/90 transition-all duration-300">
        
        {/* Navigation back to landing */}
        <div className="flex items-center justify-between mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Home
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
            AI Analyzer Workspace
          </span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col items-center text-center">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3.5 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight">
            AI Resume Analyzer
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-xs">
            {isLogin
              ? "Welcome back! Sign in with your Gmail credentials."
              : "Create your verified account with Gmail credentials."}
          </p>
        </div>

        {/* 1. TOP ROLE SELECTOR (User vs Recruiter) */}
        <div className="mt-6 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {isLogin ? "I am signing in as" : "I am registering as"}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              role === "user"
                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                : "bg-violet-500/10 text-violet-400 border-violet-500/20"
            }`}>
              {role === "user" ? "Candidate Account" : "Recruiter Account"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Candidate Card */}
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                role === "user"
                  ? "bg-gradient-to-br from-blue-600/20 via-blue-900/30 to-slate-900 border-blue-500 shadow-md shadow-blue-500/15"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl">🎓</span>
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  role === "user" ? "border-blue-400 bg-blue-500" : "border-slate-700 bg-slate-900"
                }`}>
                  {role === "user" && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </span>
              </div>
              <div className={`text-xs font-bold ${role === "user" ? "text-white" : "text-slate-300"}`}>
                Candidate / User
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                Upload resumes & verify skills
              </p>
            </button>

            {/* Recruiter Card */}
            <button
              type="button"
              onClick={() => setRole("recruiter")}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                role === "recruiter"
                  ? "bg-gradient-to-br from-violet-600/20 via-violet-900/30 to-slate-900 border-violet-500 shadow-md shadow-violet-500/15"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xl">💼</span>
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  role === "recruiter" ? "border-violet-400 bg-violet-500" : "border-slate-700 bg-slate-900"
                }`}>
                  {role === "recruiter" && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </span>
              </div>
              <div className={`text-xs font-bold ${role === "recruiter" ? "text-white" : "text-slate-300"}`}>
                Recruiter / HR
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                Search verified talent & hire
              </p>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-400 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-400 animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (if registering) */}
          {!isLogin && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aryan Sathvara"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
                  required
                />
              </div>
            </div>
          )}

          {/* Gmail Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Gmail Address
              </label>
              <span className="text-[10px] text-slate-500 font-medium">@gmail.com</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-sans"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-xs text-white shadow-lg focus:ring-2 outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer ${
              role === "recruiter"
                ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/20 focus:ring-violet-500/50"
                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-blue-500/20 focus:ring-blue-500/50"
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                <span>Authenticating...</span>
              </>
            ) : isLogin ? (
              <span>Sign In as {role === "recruiter" ? "Recruiter" : "Candidate"} →</span>
            ) : (
              <span>Create {role === "recruiter" ? "Recruiter" : "Candidate"} Account →</span>
            )}
          </button>
        </form>

        {/* 2. LOWER LOGIN / REGISTER SWITCHER */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 w-full">
            <div className="h-px flex-1 bg-slate-800"></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isLogin ? "Need an account?" : "Already have an account?"}
            </span>
            <div className="h-px flex-1 bg-slate-800"></div>
          </div>

          <div className="w-full grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800/90 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isLogin
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isLogin
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;