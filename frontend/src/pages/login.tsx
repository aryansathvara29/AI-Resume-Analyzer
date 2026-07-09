import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        // Handle Login
        const response = await api.post("/users/login", {
          email,
          password,
        });

        localStorage.setItem("token", response.data.access_token);
        setSuccessMsg("Welcome back! Redirecting...");
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        // Handle Registration
        await api.post("/users/register", {
          full_name: fullName,
          email,
          password,
          role,
        });

        setSuccessMsg("Registration successful! Logging you in...");

        // Auto Login
        const loginResponse = await api.post("/users/login", {
          email,
          password,
        });

        localStorage.setItem("token", loginResponse.data.access_token);
        
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      setErrorMsg(
        error.response?.data?.detail ||
        error.message ||
        "Authentication failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Dynamic abstract grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      {/* Decorative gradient glow elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/10 blur-[80px]"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-violet-600/10 blur-[80px]"></div>

      <div className="relative w-full max-w-md rounded-2xl bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl border border-slate-800 transition-all duration-300">
        <div className="flex flex-col items-center">
          {/* Logo Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 tracking-tight text-center">
            AI Resume Analyzer
          </h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            {isLogin ? "Welcome back! Enter credentials to access." : "Sign up to analyze your resumes and match job profiles."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 flex rounded-lg bg-slate-950 p-1 border border-slate-800/80">
          <button
            onClick={() => {
              setIsLogin(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all duration-200 ${
              isLogin
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all duration-200 ${
              !isLogin
                ? "bg-slate-800 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Register
          </button>
        </div>

        {/* Success & Error alerts */}
        {errorMsg && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Register As
                </label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-between p-3.5 rounded-lg border cursor-pointer select-none transition-all ${
                    role === "student"
                      ? "border-blue-500 bg-blue-500/5 text-white"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                  }`}>
                    <span className="text-xs font-bold">Student</span>
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      checked={role === "student"}
                      onChange={() => setRole("student")}
                      className="hidden"
                    />
                  </label>
                  <label className={`flex-1 flex items-center justify-between p-3.5 rounded-lg border cursor-pointer select-none transition-all ${
                    role === "recruiter"
                      ? "border-blue-500 bg-blue-500/5 text-white"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"
                  }`}>
                    <span className="text-xs font-bold">Recruiter</span>
                    <input
                      type="radio"
                      name="role"
                      value="recruiter"
                      checked={role === "recruiter"}
                      onChange={() => setRole("recruiter")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 py-3 font-semibold text-sm text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-violet-500 focus:ring-2 focus:ring-blue-500/50 outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            ) : isLogin ? (
              "Login to Dashboard"
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;