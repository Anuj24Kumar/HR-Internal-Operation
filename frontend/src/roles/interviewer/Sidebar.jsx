import {
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  MessageSquareCheck,
} from "lucide-react";
import UnifiedSidebar from "../../components/UnifiedSidebar.jsx";

export default function Sidebar({
  activeTab,
  setActiveTab,
  assignedInterviewRounds = 0,
  completedInterviewRounds = 0,
  feedbackCompletedRounds = 0,
  mobileOpen,
  onCloseMobile,
}) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "assigned",
      label: "Assigned Interviews",
      icon: CalendarDays,
      badge: assignedInterviewRounds,
      badgeAlert: assignedInterviewRounds > 0,
    },
    {
      id: "completed",
      label: "Completed Interviews",
      icon: CheckCircle2,
      badge: completedInterviewRounds,
    },
    {
      id: "feedback-completed",
      label: "Feedback Completed",
      icon: MessageSquareCheck,
      badge: feedbackCompletedRounds,
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
