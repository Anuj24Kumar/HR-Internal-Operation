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
      roleLabel="Interviewer"
      onViewProfile={onOpenProfile}
      onLogout={logout}
      onToggleMobile={onToggleMobile}
    />
  );
}
