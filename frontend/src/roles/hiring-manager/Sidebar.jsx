import { LayoutGrid, Clock, CheckCircle2 } from "lucide-react";
import UnifiedSidebar from "../../components/UnifiedSidebar.jsx";

export default function Sidebar({
  activeTab,
  setActiveTab,
  pendingCount = 0,
  decisionsCount = 0,
  mobileOpen,
  onCloseMobile,
}) {
  const tabs = [
    { id: "overview", label: "Dashboard", icon: LayoutGrid },
    {
      id: "pending",
      label: "Pending Decisions",
      icon: Clock,
      badge: pendingCount,
      badgeAlert: pendingCount > 0,
    },
    {
      id: "decisions",
      label: "Decisions Made",
      icon: CheckCircle2,
      badge: decisionsCount,
    },
  ];

  return (
    <UnifiedSidebar
      roleTitle="Hiring Manager"
      tabs={tabs}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}
