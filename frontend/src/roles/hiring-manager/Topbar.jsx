import UnifiedNavbar from "../../components/UnifiedNavbar.jsx";

export default function Topbar({
  user,
  onOpenProfile,
  logout,
  onToggleMobile,
}) {
  return (
    <UnifiedNavbar
      user={user}
      roleLabel="Hiring Manager"
      onViewProfile={onOpenProfile}
      onLogout={logout}
      onToggleMobile={onToggleMobile}
    />
  );
}
