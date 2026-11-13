import {
  CheckCircle2,
  LayoutDashboard,
} from "lucide-react";
import UnifiedSidebar from "../../components/UnifiedSidebar.jsx";

export default function Sidebar({
  activeTab,
  setActiveTab,
  completedInterviewRounds = 0,
  mobileOpen,
  onCloseMobile,
}) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "completed",
      label: "Completed Interviews",
      icon: CheckCircle2,
      badge: completedInterviewRounds,
    },
  ];

  return (
    <UnifiedSidebar
      roleTitle="Interviewer Portal"
      tabs={tabs}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}
