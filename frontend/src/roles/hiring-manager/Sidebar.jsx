import { LayoutGrid, FileText, Award } from "lucide-react";
import UnifiedSidebar from "../../components/UnifiedSidebar.jsx";

export default function Sidebar({
  activeTab,
  setActiveTab,
  evaluatedCount,
  selectedCount = 0,
  mobileOpen,
  onCloseMobile,
}) {
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    {
      id: "offers",
      label: "Offers",
      icon: Award,
      badge: selectedCount,
    },
    {
      id: "history",
      label: "Evaluation History",
      icon: FileText,
      badge: evaluatedCount,
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
