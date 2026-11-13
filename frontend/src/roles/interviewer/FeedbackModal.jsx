import { useState, useEffect } from "react";
import { Check, Star, X, Save, Edit3, Award, Clock } from "lucide-react";

const RATING_LABELS = {
  1: "1 - Does not meet requirements",
  2: "2 - Below expectations / partial fit",
  3: "3 - Meets job requirements",
  4: "4 - Strong hire / exceeds expectations",
  5: "5 - Exceptional candidate / top tier",
};

export default function FeedbackModal({
  selectedRound,
  onClose,
  onSaveDraft,
  onComplete,
  onUpdate,
  submitting,
  error,
}) {
  if (!selectedRound) return null;

  const interview = selectedRound.interview || {};
  const candidate = selectedRound.candidate || {};
  const isInitiallyCompleted = interview.status === "completed";
  const isLocked = Boolean(interview.isLocked || selectedRound.isLocked);

  const [isEditing, setIsEditing] = useState(!isInitiallyCompleted);
  const [score, setScore] = useState(interview.score !== undefined && interview.score !== null ? String(interview.score) : "");
  const [rating, setRating] = useState(interview.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState(interview.feedback || "");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setIsEditing(!isInitiallyCompleted);
    setScore(interview.score !== undefined && interview.score !== null ? String(interview.score) : "");
    setRating(interview.rating || 0);
    setFeedback(interview.feedback || "");
    setLocalError("");
  }, [selectedRound, isInitiallyCompleted]);

  const validateFull = () => {
    const numScore = Number(score);
    if (score === "" || isNaN(numScore) || numScore < 0 || numScore > 100) {
      setLocalError("Please enter a valid interview score between 0 and 100.");
      return false;
    }
    if (!rating || rating < 1 || rating > 5) {
      setLocalError("Please select a rating between 1 and 5 stars.");
      return false;
    }
    if (!feedback.trim()) {
      setLocalError("Please provide interview evaluation feedback.");
      return false;
    }
    setLocalError("");
    return true;
  };

  const handleSaveDraftClick = async () => {
    setLocalError("");
    const numScore = score !== "" ? Number(score) : undefined;
    if (numScore !== undefined && (isNaN(numScore) || numScore < 0 || numScore > 100)) {
      setLocalError("Score must be between 0 and 100.");
      return;
    }
    const numRating = rating ? Number(rating) : undefined;
    if (numRating !== undefined && (numRating < 1 || numRating > 5)) {
      setLocalError("Rating must be between 1 and 5 stars.");
      return;
    }

    await onSaveDraft({
      score: numScore,
      rating: numRating,
      feedback: feedback.trim(),
    });
  };

  const handleCompleteClick = async (e) => {
    e.preventDefault();
    if (!validateFull()) return;

    if (isInitiallyCompleted && onUpdate) {
      await onUpdate({
        score: Number(score),
        rating: Number(rating),
        feedback: feedback.trim(),
      });
      return;
    }

    await onComplete({
      score: Number(score),
      rating: Number(rating),
      feedback: feedback.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isInitiallyCompleted && !isEditing
                ? "Interview Evaluation Details"
                : isInitiallyCompleted && isEditing
                ? "Update Interview Feedback"
                : "Evaluate Interview"}
            </h3>
            <p className="text-xs text-slate-500">
              Round: <span className="font-semibold text-slate-700">{interview.roundName || `Round ${interview.round || 1}`}</span> · Status:{" "}
              <span className="font-semibold capitalize text-slate-700">{interview.status || "Scheduled"}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Candidate Summary */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">{candidate.name || "Candidate"}</p>
              <p className="text-[11px] text-slate-500">{candidate.position || "Applicant"} · {candidate.email || ""}</p>
            </div>
            {candidate.resumeUrl && (
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View Resume →
              </a>
            )}
          </div>
        </div>

        {/* Form or Read-only content */}
        <div className="p-6 space-y-5">
          {(localError || error) && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {localError || error}
            </div>
          )}

          {isInitiallyCompleted && !isEditing ? (
            /* Read-only view */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                  <p className="text-[11px] font-semibold text-slate-400">Score</p>
                  <p className="mt-1 text-lg font-bold text-blue-600">{interview.score ?? "—"} / 100</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                  <p className="text-[11px] font-semibold text-slate-400">Rating</p>
                  <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-amber-500">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {interview.rating ?? "—"} / 5
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400">Feedback Notes</p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {interview.feedback || "No feedback recorded."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {isLocked ? (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Feedback locked: Hiring decision finalized.</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    Feedback can be revised until hiring decision is recorded.
                  </div>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Update Feedback
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Edit / Submission Form */
            <form onSubmit={handleCompleteClick} className="space-y-4">
              {/* Score Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-800">
                    Interview Score (0 - 100) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Whole number</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  placeholder="e.g. 85"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Rating 1-5 Stars */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  Performance Rating (1 - 5 Stars) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(starVal => {
                      const isFilled = (hoverRating || rating) >= starVal;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(starVal)}
                          className="p-1 text-slate-300 hover:scale-110 transition"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              isFilled
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 ml-2">
                    {RATING_LABELS[hoverRating || rating] || "Select star rating"}
                  </span>
                </div>
              </div>

              {/* Feedback Textarea with char counter */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-800">
                    Evaluation Feedback & Remarks <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {feedback.length} / 5000 characters
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={5000}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Summarize candidate technical proficiency, strengths, problem solving, and hiring recommendation..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraftClick}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Draft
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isInitiallyCompleted ? "Update & Save" : "Complete Interview & Submit"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
