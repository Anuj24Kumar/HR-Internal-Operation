import UnifiedNavbar from "../../../components/UnifiedNavbar.jsx";

export default function Header({
  user,
  onLogout,
  onViewProfile,
  onToggleMobile,
}) {
  const notifications = [
    { id: "audit", title: "System Audit", message: "Immutable audit logs operational." },
    { id: "workflows", title: "Approval Routing", message: "Workflows engine healthy." },
  ];

  return (
    <UnifiedNavbar
      user={user}
      roleLabel="Admin"
      onViewProfile={onViewProfile}
      onLogout={onLogout}
      notifications={notifications}
      onToggleMobile={onToggleMobile}
    />
  );
}
