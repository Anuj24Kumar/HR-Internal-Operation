import { useEffect, useState } from "react";
import useRoleAuth from "../useRoleAuth.js";
import { apiRequest } from "../../api.js";
import FeedbackModal from "./FeedbackModal.jsx";
import InterviewMain from "./InterviewMain.jsx";
import Profile from "./Profile.jsx";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function InterviewerEntry() {
  const { user, logout, isAuthenticated } = useRoleAuth("interviewer");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [interviewList, setInterviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [rating, setRating] = useState(0);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [isCompletingEvaluation, setIsCompletingEvaluation] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadInterviews();
    }
  }, [isAuthenticated]);

  async function loadInterviews() {
    setLoading(true);
    setActionError(null);
    try {
      const res = await apiRequest("/interviewer/interviews?limit=50");
      if (res.data) {
        setInterviewList(res.data);
      }
    } catch (err) {
      console.error("Failed to load interviewer interviews:", err);
      setActionError("Failed to load interview rounds: " + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadInterviews();
  }

  async function handleCompleteInterview(item) {
    const candidateId = item.candidate?._id;
    const roundId = item.interview?._id;
    if (!candidateId || !roundId) {
      setActionError("Unable to identify this assigned interview.");
      return false;
    }

    setSelectedRound(item);
    setIsCompletingEvaluation(true);
    setIsUpdate(false);
    setScore(item.interview.score ?? "");
    setRating(item.interview.rating ?? 0);
    setFeedback("");
    setActionError(null);
    setEvaluationError("");
    setActionMessage(null);
    return true;
  }

  function openFeedbackModal(item) {
    setSelectedRound(item);
    setIsCompletingEvaluation(false);
    setEvaluationError("");
    const existingRating = item.interview.rating;
    const existingFeedback = item.interview.feedback;
    const alreadySubmitted = existingRating != null || Boolean(existingFeedback?.trim());

    setIsUpdate(alreadySubmitted);
    setRating(existingRating || 0);
    setScore(item.interview.score ?? "");
    setFeedback(existingFeedback || "");
  }

  async function handleSubmitFeedback(event) {
    event.preventDefault();
    const numericScore = Number(score);
    if (score === "" || !Number.isInteger(numericScore) || numericScore < 0 || numericScore > 100) {
      setEvaluationError("Enter a whole-number interview score from 0 to 100.");
      return;
    }
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      setEvaluationError("Select an interviewer rating from 1 to 5 stars.");
      return;
    }
    if (!feedback.trim()) {
      setEvaluationError("Enter the interview result description before submitting.");
      return;
    }

    setSubmittingFeedback(true);
    setEvaluationError("");
    setActionError(null);

    const candidateId = selectedRound.candidate._id;
    const roundId = selectedRound.interview._id || selectedRound.interview.round;

    try {
      const method = isUpdate ? "PATCH" : "POST";
      const endpoint = `/candidates/${candidateId}/interviews/${roundId}/feedback`;

      if (isCompletingEvaluation) {
        await apiRequest(endpoint, {
          method,
          body: JSON.stringify({
            status: "completed",
            score: numericScore,
            rating: Number(rating),
            feedback: feedback.trim(),
          }),
        });
      } else {
        await apiRequest(endpoint, {
          method,
          body: JSON.stringify({
            score: numericScore,
            rating: Number(rating),
            feedback: feedback.trim(),
          }),
        });
      }

      setActionMessage(
        isCompletingEvaluation
          ? "Interview completed and evaluation submitted for hiring-manager review."
          : isUpdate
          ? "Interview assessment updated successfully."
          : "Interview rating and feedback submitted successfully!"
      );
      setTimeout(() => setActionMessage(null), 4000);

      setSelectedRound(null);
      setIsCompletingEvaluation(false);
      setEvaluationError("");
      await loadInterviews();
    } catch (err) {
      console.error("Feedback submission error:", err);
      setEvaluationError(`Failed to submit interview evaluation: ${err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const totalRounds = interviewList.length;
  const pendingInterviewRounds = interviewList.filter(
    (item) => item.interview.status !== "completed" && item.interview.status !== "cancelled"
  );
  const completedInterviewRounds = interviewList.filter(
    (item) => item.interview.status === "completed"
  );
  const hasFeedback = (interview) =>
    interview.rating != null || Boolean(interview.feedback?.trim());
  const pendingFeedbackRounds = completedInterviewRounds.filter(
    (item) => !hasFeedback(item.interview)
  );
  const feedbackCompletedRounds = completedInterviewRounds.filter((item) =>
    hasFeedback(item.interview)
  );

  const filteredInterviews = activeTab === "completed"
    ? pendingFeedbackRounds
    : interviewList;

  return (
    <div className="shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        completedInterviewRounds={completedInterviewRounds.length}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="main-shell md:ml-[260px]">
        <Topbar
          user={user}
          onOpenProfile={() => setActiveTab("profile")}
          logout={logout}
          pendingRounds={pendingFeedbackRounds.length}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {activeTab === "profile" ? (
          <Profile user={user} />
        ) : (
          <InterviewMain
            actionMessage={actionMessage}
            actionError={actionError}
            handleRefresh={handleRefresh}
            refreshing={refreshing}
            totalRounds={totalRounds}
            pendingInterviewRounds={pendingInterviewRounds.length}
            completedInterviewRounds={completedInterviewRounds.length}
            pendingFeedbackRounds={pendingFeedbackRounds.length}
            feedbackCompletedRounds={feedbackCompletedRounds.length}
            completedFeedbackInterviews={feedbackCompletedRounds}
            activeTab={activeTab}
            loading={loading}
            filteredInterviews={filteredInterviews}
            openFeedbackModal={openFeedbackModal}
            onCompleteInterview={handleCompleteInterview}
          />
        )}

      </div>

      <FeedbackModal
        selectedRound={selectedRound}
        setSelectedRound={setSelectedRound}
        isUpdate={isUpdate}
        handleSubmitFeedback={handleSubmitFeedback}
        hoverRating={hoverRating}
        setHoverRating={setHoverRating}
        rating={rating}
        setRating={setRating}
        score={score}
        setScore={setScore}
        feedback={feedback}
        setFeedback={setFeedback}
        isCompletingEvaluation={isCompletingEvaluation}
        evaluationError={evaluationError}
        submittingFeedback={submittingFeedback}
      />
    </div>
  );
}
