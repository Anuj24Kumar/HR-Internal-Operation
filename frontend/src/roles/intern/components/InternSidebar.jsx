import { LayoutDashboard, CheckSquare, Files, Award, FileText } from "lucide-react";
import UnifiedSidebar from "../../../components/UnifiedSidebar.jsx";

const internTabs = [
  { label: "Overview", path: "/intern", icon: LayoutDashboard, end: true },
  { label: "My Offer", path: "/intern/offer", icon: Award },
  { label: "My Onboarding", path: "/intern/onboarding", icon: CheckSquare },
  { label: "My Documents", path: "/intern/documents", icon: Files },
  { label: "My Letters", path: "/intern/letters", icon: FileText },
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
