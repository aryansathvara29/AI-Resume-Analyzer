import React, { useState } from "react";
import api from "../services/api";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
}

interface Resource {
  title: string;
  type: string;
  url: string;
  difficulty: string;
  estimated_time: string;
}

interface Props {
  skillName: string;
  onClose: () => void;
  onVerificationComplete: () => void;
}

export const SkillVerificationModal: React.FC<Props> = ({
  skillName,
  onClose,
  onVerificationComplete,
}) => {
  const [step, setStep] = useState<"choose" | "certificate" | "ai_test_loading" | "ai_test_quiz" | "result">(
    "choose"
  );

  // Certificate Upload States
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certUploading, setCertUploading] = useState(false);
  const [certError, setCertError] = useState("");

  // AI Test States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [testSubmitting, setTestSubmitting] = useState(false);

  // Result States
  const [testResult, setTestResult] = useState<{
    score: number;
    total: number;
    passed: boolean;
    status: string;
    learning_resources?: Resource[];
  } | null>(null);
  const [generalError, setGeneralError] = useState("");

  // Handle Certificate Upload
  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "png", "jpg", "jpeg"].includes(ext || "")) {
        setCertError("Invalid format! Please upload a PDF, PNG, or JPG file.");
        setCertFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setCertError("File size exceeds maximum limit of 5 MB!");
        setCertFile(null);
        return;
      }
      setCertError("");
      setCertFile(file);
    }
  };

  const handleUploadCertificate = async () => {
    if (!certFile) {
      setCertError("Please select a valid certificate file.");
      return;
    }
    try {
      setCertUploading(true);
      setCertError("");
      const formData = new FormData();
      formData.append("skill_name", skillName);
      formData.append("file", certFile);

      await api.post("/skills/verify/certificate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onVerificationComplete();
      onClose();
    } catch (err: any) {
      console.error("Certificate upload error:", err);
      setCertError(err.response?.data?.detail || "Failed to upload certificate.");
    } finally {
      setCertUploading(false);
    }
  };

  // Handle Start AI Test
  const handleStartAITest = async () => {
    try {
      setStep("ai_test_loading");
      setGeneralError("");
      const res = await api.post("/skills/generate-test", { skill_name: skillName });
      if (res.data.questions && res.data.questions.length > 0) {
        setQuestions(res.data.questions);
        setCurrentIdx(0);
        setSelectedAnswers({});
        setStep("ai_test_quiz");
      } else {
        setGeneralError("Failed to load questions. Please try again.");
        setStep("choose");
      }
    } catch (err: any) {
      console.error("Error generating test:", err);
      setGeneralError(err.response?.data?.detail || "Failed to generate AI test.");
      setStep("choose");
    }
  };

  // Handle Select Option
  const handleOptionSelect = (optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionIdx,
    }));
  };

  // Handle Submit Quiz
  const handleSubmitQuiz = async () => {
    try {
      setTestSubmitting(true);
      let calculatedScore = 0;
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correct_index) {
          calculatedScore += 1;
        }
      });

      const res = await api.post("/skills/submit-test", {
        skill_name: skillName,
        score: calculatedScore,
        total: questions.length,
      });

      setTestResult(res.data);
      setStep("result");
      onVerificationComplete();
    } catch (err: any) {
      console.error("Error submitting test:", err);
      setGeneralError(err.response?.data?.detail || "Failed to submit test.");
    } finally {
      setTestSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              Skill Verification
            </span>
            <h2 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
              <span>🛡️</span> Verify {skillName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {generalError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-semibold text-rose-400 flex items-center gap-2">
            <span>⚠️</span> {generalError}
          </div>
        )}

        {/* STEP 1: CHOOSE VERIFICATION METHOD */}
        {step === "choose" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 font-medium">
              Choose how you would like to verify your proficiency in <strong className="text-white font-bold">{skillName}</strong>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Option 1: Upload Certificate */}
              <button
                type="button"
                onClick={() => setStep("certificate")}
                className="bg-slate-950/80 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl text-left transition-all group space-y-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  📜
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white group-hover:text-blue-300">Upload Certificate</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Upload official PDF or image certificate for instant verification.
                  </p>
                </div>
              </button>

              {/* Option 2: Take AI Verification Test */}
              <button
                type="button"
                onClick={handleStartAITest}
                className="bg-slate-950/80 hover:bg-violet-950/40 border border-slate-800 hover:border-violet-500/50 p-5 rounded-2xl text-left transition-all group space-y-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                  🤖
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white group-hover:text-violet-300">Take AI Test</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Take a 10-question interview test generated by Gemini AI.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD CERTIFICATE */}
        {step === "certificate" && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 mx-auto flex items-center justify-center text-2xl text-blue-400">
                📁
              </div>
              <div>
                <p className="text-xs font-bold text-white">Select Certificate File</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG (Max 5 MB)</p>
              </div>

              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleCertFileChange}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
            </div>

            {certFile && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs font-semibold text-blue-300 flex items-center justify-between">
                <span className="truncate">📄 {certFile.name}</span>
                <span className="font-mono text-[10px]">{(certFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}

            {certError && (
              <p className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                <span>⚠️</span> {certError}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleUploadCertificate}
                disabled={certUploading || !certFile}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                {certUploading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Uploading & Verifying...
                  </>
                ) : (
                  "Upload & Verify Certificate"
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3A: AI TEST LOADING */}
        {step === "ai_test_loading" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
            <div>
              <h3 className="text-sm font-bold text-white">Generating 10 MCQs for {skillName}...</h3>
              <p className="text-xs text-slate-400 mt-1">Gemini AI is framing technical interview questions</p>
            </div>
          </div>
        )}

        {/* STEP 3B: AI TEST QUIZ INTERFACE */}
        {step === "ai_test_quiz" && questions.length > 0 && (
          <div className="space-y-5">
            {/* Progress & Counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Question {currentIdx + 1} of {questions.length}</span>
                <span className="text-violet-400 font-mono">{Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white leading-relaxed">
                {questions[currentIdx].question}
              </h3>
            </div>

            {/* 4 Options */}
            <div className="space-y-2.5">
              {questions[currentIdx].options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[currentIdx] === oIdx;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleOptionSelect(oIdx)}
                    className={`w-full px-4 py-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-violet-600/30 border-violet-500 text-white shadow-md shadow-violet-500/20"
                        : "bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center ${
                        isSelected ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {isSelected && <span className="text-violet-400">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30 transition-all"
              >
                Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  disabled={selectedAnswers[currentIdx] === undefined}
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-xs font-bold text-white transition-all shadow-lg shadow-violet-600/30"
                >
                  Next Question →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={testSubmitting || selectedAnswers[currentIdx] === undefined}
                  onClick={handleSubmitQuiz}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-xs font-extrabold text-white transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  {testSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      Evaluating Result...
                    </>
                  ) : (
                    "Submit Assessment ✓"
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: RESULT SCREEN */}
        {step === "result" && testResult && (
          <div className="space-y-6">
            {/* PASSING RESULT (Score >= 6) */}
            {testResult.passed ? (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-3xl text-emerald-400">
                  ✅
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Verified by AI Test
                  </span>
                  <h3 className="text-2xl font-black text-white mt-2">
                    {testResult.score} / {testResult.total}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Congratulations! You have successfully verified your proficiency in <strong>{skillName}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              /* FAILING RESULT (Score < 6) */
              <div className="space-y-5 animate-fade-in">
                <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-5 text-center space-y-2">
                  <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Learning Recommended
                  </span>
                  <h3 className="text-2xl font-black text-rose-400 mt-1">
                    {testResult.score} / {testResult.total}
                  </h3>
                  <p className="text-xs font-semibold text-rose-300 max-w-md mx-auto leading-relaxed">
                    This skill could not be verified. We recommend improving your knowledge before keeping it in your resume.
                  </p>
                </div>

                {/* TAILORED LEARNING RESOURCES */}
                {testResult.learning_resources && testResult.learning_resources.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <span>📚</span> Recommended Learning Resources for {skillName}
                    </h4>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {testResult.learning_resources.map((res, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{res.title}</span>
                              <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {res.difficulty}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                              <span>📁 {res.type}</span>
                              <span>⏳ {res.estimated_time}</span>
                            </div>
                          </div>

                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white transition-all whitespace-nowrap"
                          >
                            Start Learning ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    Close & Review Resources
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
