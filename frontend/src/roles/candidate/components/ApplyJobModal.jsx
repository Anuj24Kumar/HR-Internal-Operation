import { useState } from "react";
import { X, UploadCloud, CheckCircle2, AlertCircle, FileText, Briefcase, User, Mail, Phone, Hash } from "lucide-react";
import { applyForJob } from "../services/candidateService.js";

const POPULAR_POSITIONS = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "Data Analyst",
  "QA Engineer",
  "Product Management Intern",
  "HR Associate",
];

export default function ApplyJobModal({ isOpen, onClose, profile, onSuccess }) {
  const [position, setPosition] = useState("");
  const [jobType, setJobType] = useState("full_time");
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const candidateName =
    profile?.name ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "Candidate";
  const candidateEmail = profile?.email || "";
  const candidatePhone = profile?.phone || "";
  const candidateId = profile?._id || profile?.id || "Auto-assigned";

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Resume file size should not exceed 10MB.");
        return;
      }
      setResumeFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!position.trim()) {
      setError("Please specify the position you are applying for.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("position", position.trim());
      formData.append("jobType", jobType);
      formData.append("candidateName", candidateName);
      formData.append("email", candidateEmail);
      formData.append("phone", candidatePhone);

      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      const result = await applyForJob(formData);
      const createdApp = result.data || result.application || result;

      if (onSuccess) {
        onSuccess(createdApp);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Apply for Position</h2>
              <p className="text-xs text-slate-500">
                Complete the application details below to apply for a new role.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Auto-Fetched Candidate Information */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Candidate Information (Auto-fetched)
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <CheckCircle2 className="h-3 w-3" /> Auto-populated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2.5 rounded-lg bg-white p-2.5 border border-slate-200">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[11px] text-slate-400">Full Name</p>
                  <p className="font-medium text-slate-800 truncate">{candidateName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-lg bg-white p-2.5 border border-slate-200">
                <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[11px] text-slate-400">Email Address</p>
                  <p className="font-medium text-slate-800 truncate">{candidateEmail || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-lg bg-white p-2.5 border border-slate-200">
                <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[11px] text-slate-400">Phone Number</p>
                  <p className="font-medium text-slate-800 truncate">{candidatePhone || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 rounded-lg bg-white p-2.5 border border-slate-200">
                <Hash className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="truncate">
                  <p className="text-[11px] text-slate-400">Candidate Unique ID</p>
                  <p className="font-mono text-xs font-semibold text-slate-700 truncate">{candidateId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Position Applying For */}
          <div className="space-y-2">
            <label htmlFor="position" className="block text-sm font-semibold text-slate-800">
              Position applying for <span className="text-red-500">*</span>
            </label>
            <input
              id="position"
              type="text"
              list="position-suggestions"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Software Engineer, Frontend Developer, HR Associate"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <datalist id="position-suggestions">
              {POPULAR_POSITIONS.map((pos) => (
                <option key={pos} value={pos} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs text-slate-400 self-center">Suggestions:</span>
              {POPULAR_POSITIONS.slice(0, 4).map((pos) => (
                <button
                  type="button"
                  key={pos}
                  onClick={() => setPosition(pos)}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200 transition"
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Job Type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Job Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                  jobType === "full_time"
                    ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="jobType"
                    value="full_time"
                    checked={jobType === "full_time"}
                    onChange={() => setJobType("full_time")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Full-time</p>
                    <p className="text-xs text-slate-500">Regular permanent employment</p>
                  </div>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition ${
                  jobType === "internship"
                    ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="jobType"
                    value="internship"
                    checked={jobType === "internship"}
                    onChange={() => setJobType("internship")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Internship</p>
                    <p className="text-xs text-slate-500">Structured internship program</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Upload Resume */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">
              Upload Resume <span className="text-slate-400 font-normal">(PDF, DOC, DOCX, PNG, JPG - max 10MB)</span>
            </label>
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-5 hover:bg-slate-50 transition">
              {resumeFile ? (
                <div className="flex w-full items-center justify-between rounded-lg bg-white p-3 border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-3 truncate">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-slate-800 truncate">{resumeFile.name}</p>
                      <p className="text-xs text-slate-400">
                        {(resumeFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 ml-3"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm font-medium text-slate-700">
                    <span className="text-blue-600 hover:underline">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, PNG, JPG up to 10MB</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
