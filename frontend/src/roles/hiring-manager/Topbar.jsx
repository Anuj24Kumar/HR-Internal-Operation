import UnifiedNavbar from "../../components/UnifiedNavbar.jsx";

export default function Topbar({
  user,
  onOpenProfile,
  logout,
  pendingCount = 0,
  onToggleMobile,
}) {
  const notifications =
    pendingCount > 0
      ? [
          {
            id: "approvals-pending",
            title: "Offer Approvals",
            message: `You have ${pendingCount} pending offer approval(s) awaiting your sign-off.`,
          },
        ]
      : [];

  return (
    <UnifiedNavbar
      user={user}
      roleLabel="Hiring Manager"
      onViewProfile={onOpenProfile}
      onLogout={logout}
      notifications={notifications}
      onToggleMobile={onToggleMobile}
    />
  );
}
