import { LayoutDashboard, Award } from "lucide-react";
import UnifiedSidebar from "../../../components/UnifiedSidebar.jsx";

const candidateTabs = [
  { label: "Dashboard", path: "/candidate", icon: LayoutDashboard, end: true },
  { label: "My Offer", path: "/candidate/offer", icon: Award },
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
