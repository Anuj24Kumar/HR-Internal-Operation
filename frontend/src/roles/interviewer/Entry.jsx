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
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [evaluationError, setEvaluationError] = useState("");
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
      const assigned = res.data?.interviews || res.interviews || res.data || [];
      setInterviewList(
        assigned.map((item) =>
          item.interview
            ? item
            : {
                candidate: item.candidateId,
                interview: { ...item, candidateId: undefined },
              }
        )
      );
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
    if (String(item.interview?.status || "").toLowerCase() === "completed") return;
    setSelectedRound(item);
    setEvaluationError("");
  }

  // Save Draft (POST /candidates/:id/interviews/:roundId/feedback)
  async function handleSaveDraft({ score, rating, feedback }) {
    if (!selectedRound) return;
    const candidateId = selectedRound.candidate?._id;
    const roundId = selectedRound.interview?._id;
    if (!candidateId || !roundId) return;

    setSubmittingFeedback(true);
    setEvaluationError("");
    try {
      await apiRequest(`/candidates/${candidateId}/interviews/${roundId}/feedback`, {
        method: "POST",
        body: JSON.stringify({ score, rating, feedback }),
      });

      setActionMessage("Evaluation draft saved successfully.");
      setTimeout(() => setActionMessage(null), 4000);
      setSelectedRound(null);
      await loadInterviews();
    } catch (err) {
      setEvaluationError(err.message || "Failed to save draft feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  // Complete Interview & Submit (PATCH /candidates/:id/interviews/:roundId/status)
  async function handleCompleteInterview({ score, rating, feedback }) {
    if (!selectedRound) return;
    const candidateId = selectedRound.candidate?._id;
    const roundId = selectedRound.interview?._id;
    if (!candidateId || !roundId) return;

    setSubmittingFeedback(true);
    setEvaluationError("");
    try {
      await apiRequest(`/candidates/${candidateId}/interviews/${roundId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          score,
          rating,
          feedback,
        }),
      });

      setActionMessage("Interview marked complete and feedback submitted to Hiring Manager!");
      setTimeout(() => setActionMessage(null), 4000);
      setSelectedRound(null);
      await loadInterviews();
    } catch (err) {
      setEvaluationError(err.message || "Failed to complete interview.");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const completedCount = interviewList.filter(
    (item) => item.interview?.status === "completed"
  ).length;

  return (
    <div className="shell">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        completedInterviewRounds={completedCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="main-shell md:ml-[260px]">
        <Topbar
          user={user}
          onOpenProfile={() => setActiveTab("profile")}
          logout={logout}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />

        {activeTab === "profile" ? (
          <Profile user={user} />
        ) : (
          <main className="content-area p-4 sm:p-6 lg:p-8 pb-16">
            <InterviewMain
              interviews={interviewList}
              selectedView={activeTab === "completed" ? "completed" : "upcoming"}
              onViewChange={(view) =>
                setActiveTab(view === "completed" ? "completed" : "dashboard")
              }
              loading={loading}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onOpenFeedback={openFeedbackModal}
              successNotice={actionMessage}
              errorNotice={actionError}
            />
          </main>
        )}
      </div>

      <FeedbackModal
        selectedRound={selectedRound}
        onClose={() => setSelectedRound(null)}
        onSaveDraft={handleSaveDraft}
        onComplete={handleCompleteInterview}
        submitting={submittingFeedback}
        error={evaluationError}
      />
    </div>
  );
}
