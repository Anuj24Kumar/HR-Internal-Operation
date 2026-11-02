import UnifiedNavbar from "../../components/UnifiedNavbar.jsx";

export default function Topbar({
  user,
  onOpenProfile,
  logout,
  pendingRounds = 0,
  onToggleMobile,
}) {
  const notifications =
    pendingRounds > 0
      ? [
          {
            id: "feedback-pending",
            title: "Pending Feedback",
            message: `You have ${pendingRounds} completed interview(s) awaiting your assessment feedback.`,
          },
        ]
      : [];

  return (
    <UnifiedNavbar
      user={user}
      roleLabel="Interviewer"
      onViewProfile={onOpenProfile}
      onLogout={logout}
      notifications={notifications}
      onToggleMobile={onToggleMobile}
    />
  );
}
