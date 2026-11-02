import {
  BriefcaseBusiness,
  CheckSquare,
  LayoutGrid,
  Users,
} from "lucide-react";
import UnifiedSidebar from "../../components/UnifiedSidebar.jsx";

export default function Sidebar({
  activeTab,
  setActiveTab,
  candidateCount,
  approvalCount,
  roleCount,
  mobileOpen,
  onCloseMobile,
}) {
  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "candidates", label: "Assigned Candidates", icon: Users, badge: candidateCount },
    {
      id: "approvals",
      label: "Offer Approvals",
      icon: CheckSquare,
      badge: approvalCount,
      badgeAlert: approvalCount > 0,
    },
    { id: "roles", label: "Department Roles", icon: BriefcaseBusiness, badge: roleCount },
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
