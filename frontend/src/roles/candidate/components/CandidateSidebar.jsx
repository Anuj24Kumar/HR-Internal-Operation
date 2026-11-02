import { LayoutDashboard, FileText, Files, Award, User } from "lucide-react";
import UnifiedSidebar from "../../../components/UnifiedSidebar.jsx";

const candidateTabs = [
  { label: "Overview", path: "/candidate", icon: LayoutDashboard, end: true },
  { label: "My Application", path: "/candidate/application", icon: FileText },
  { label: "My Documents", path: "/candidate/documents", icon: Files },
  { label: "My Offer", path: "/candidate/offer", icon: Award },
  { label: "My Profile", path: "/candidate/profile", icon: User },
];

export default function CandidateSidebar({ mobileOpen, onCloseMobile }) {
  return (
    <UnifiedSidebar
      roleTitle="Candidate Portal"
      tabs={candidateTabs}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}
