import { LayoutDashboard, User, CheckSquare, Files } from "lucide-react";
import UnifiedSidebar from "../../../components/UnifiedSidebar.jsx";

const internTabs = [
  { label: "Overview", path: "/intern", icon: LayoutDashboard, end: true },
  { label: "My Profile", path: "/intern/profile", icon: User },
  { label: "My Onboarding", path: "/intern/onboarding", icon: CheckSquare },
  { label: "My Documents", path: "/intern/documents", icon: Files },
];

export default function InternSidebar({ mobileOpen, onCloseMobile }) {
  return (
    <UnifiedSidebar
      roleTitle="Intern Portal"
      tabs={internTabs}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}
