import React, { useState } from "react";
import api from "../services/api";

interface Props {
  skillName: string;
  resumeId?: number;
  onClose: () => void;
  onVerificationComplete: () => void;
}

export const SkillVerificationModal: React.FC<Props> = ({
  skillName,
  resumeId,
  onClose,
  onVerificationComplete,
}) => {
  // Certificate Upload States
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certUploading, setCertUploading] = useState(false);
  const [certError, setCertError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Handle Certificate Upload
  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const cleanName = file.name.trim();
      const ext = cleanName.split(".").pop()?.toLowerCase();
      const isAllowedExt = ["pdf", "png", "jpg", "jpeg"].includes(ext || "");
      const isAllowedMime = file.type ? file.type.includes("pdf") || file.type.includes("image") : false;

      if (!isAllowedExt && !isAllowedMime) {
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
      if (resumeId) {
        formData.append("resume_id", resumeId.toString());
      }
      formData.append("file", certFile, certFile.name || "certificate.pdf");

      await api.post("/skills/verify/certificate", formData);

      setUploadSuccess(true);
      setTimeout(() => {
        onVerificationComplete();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error("Certificate upload error:", err);
      let msg = err.response?.data?.detail;
      if (Array.isArray(msg)) {
        msg = msg.map((m: any) => m.msg || m).join(", ");
      }
      if (err.message === "Network Error" || !err.response) {
        setCertError("Backend server is waking up (Render cold start). Please try again in 5 seconds.");
      } else {
        setCertError(msg || err.message || "Failed to upload certificate.");
      }
    } finally {
      setCertUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              Certificate Verification
            </span>
            <h2 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
              <span>📜</span> Upload Certificate for <span className="capitalize text-blue-400">{skillName}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {uploadSuccess ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-3xl text-emerald-400 shadow-lg shadow-emerald-500/20">
              ✅
            </div>
            <h3 className="text-lg font-extrabold text-white">Certificate Verified Successfully!</h3>
            <p className="text-xs text-emerald-300">
              Proficiency in <strong className="text-white capitalize">{skillName}</strong> is now verified in your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Upload your official certificate document (Course completion, Industry certification, or Assessment proof) to verify your proficiency in <strong className="text-white font-bold capitalize">{skillName}</strong>.
            </p>

            <div className="bg-slate-950/70 border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-center space-y-3 transition-colors">
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
                <span className="truncate max-w-[280px]">📄 {certFile.name}</span>
                <span className="font-mono text-[10px] text-blue-400">{(certFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}

            {certError && (
              <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <span>⚠️</span> {certError}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadCertificate}
                disabled={certUploading || !certFile}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {certUploading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Uploading &amp; Verifying...
                  </>
                ) : (
                  "Upload & Verify Certificate"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
