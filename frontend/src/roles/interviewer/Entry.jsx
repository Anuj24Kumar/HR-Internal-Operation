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
  const [rating, setRating] = useState(4);
  const [feedback, setFeedback] = useState("");
  const [isUpdate, setIsUpdate] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

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

  function openFeedbackModal(item) {
    setSelectedRound(item);
    const existingRating = item.interview.rating;
    const existingFeedback = item.interview.feedback;
    const alreadySubmitted = existingRating != null || Boolean(existingFeedback?.trim());

    setIsUpdate(alreadySubmitted);
    setRating(existingRating || 4);
    setFeedback(existingFeedback || "");
  }

  async function handleSubmitFeedback(event) {
    event.preventDefault();
    if (!feedback.trim()) {
      alert("Please provide detailed assessment feedback before submitting.");
      return;
    }

    setSubmittingFeedback(true);
    setActionError(null);

    const candidateId = selectedRound.candidate._id;
    const roundId = selectedRound.interview._id || selectedRound.interview.round;

    try {
      const method = isUpdate ? "PATCH" : "POST";
      const endpoint = `/candidates/${candidateId}/interviews/${roundId}/feedback`;

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify({
          rating: Number(rating),
          feedback: feedback.trim(),
        }),
      });

      setActionMessage(
        isUpdate
          ? "Interview assessment updated successfully."
          : "Interview rating and feedback submitted successfully!"
      );
      setTimeout(() => setActionMessage(null), 4000);

      setSelectedRound(null);
      loadInterviews();
    } catch (err) {
      console.error("Feedback submission error:", err);
      alert("Failed to submit feedback: " + err.message);
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
    ? completedInterviewRounds
    : activeTab === "feedback-completed"
      ? feedbackCompletedRounds
      : activeTab === "assigned"
        ? pendingInterviewRounds
        : interviewList;

  return (
    <div className="shell">
      <Sidebar
        user={user}
        logout={logout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setActiveTab("profile")}
        assignedInterviewRounds={pendingInterviewRounds.length}
        completedInterviewRounds={completedInterviewRounds.length}
        feedbackCompletedRounds={feedbackCompletedRounds.length}
      />

      <div className="main-shell">
        <Topbar
          userName={user?.name}
          pendingRounds={pendingFeedbackRounds.length}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
        />

        {activeTab === "profile" ? (
          <Profile user={user} onBack={() => setActiveTab("dashboard")} />
        ) : (
          <InterviewMain
            user={user}
            actionMessage={actionMessage}
            actionError={actionError}
            handleRefresh={handleRefresh}
            refreshing={refreshing}
            totalRounds={totalRounds}
            pendingInterviewRounds={pendingInterviewRounds.length}
            completedInterviewRounds={completedInterviewRounds.length}
            pendingFeedbackRounds={pendingFeedbackRounds.length}
            feedbackCompletedRounds={feedbackCompletedRounds.length}
            activeTab={activeTab}
            loading={loading}
            filteredInterviews={filteredInterviews}
            openFeedbackModal={openFeedbackModal}
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
        feedback={feedback}
        setFeedback={setFeedback}
        submittingFeedback={submittingFeedback}
      />
    </div>
  );
}
