import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  FileText,
  History,
} from "lucide-react";
import UnifiedSidebar from "../../../components/UnifiedSidebar.jsx";

export default function Sidebar({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "recruitment", label: "Recruitment", icon: Briefcase },
    { id: "employees", label: "Employees", icon: UserCheck },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "audit", label: "Audit Logs", icon: History },
  ];

  return (
    <UnifiedSidebar
      roleTitle="Admin Console"
      tabs={navItems}
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}
