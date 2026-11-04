import UnifiedNavbar from "../../../components/UnifiedNavbar.jsx";
import NotificationBell from "../../../components/NotificationBell.jsx";

export default function Header({
  user,
  onLogout,
  onViewProfile,
  onToggleMobile,
  onOpenSearch,
}) {
  return (
    <UnifiedNavbar
      user={user}
      roleLabel="Admin"
      onViewProfile={onViewProfile}
      onLogout={onLogout}
      onToggleMobile={onToggleMobile}
      onOpenSearch={onOpenSearch}
      rightContent={<NotificationBell />}
    />
  );
}
