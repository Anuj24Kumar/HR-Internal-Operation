import { useEffect, useState } from "react";
import { LayoutDashboard, FileText, Award, FolderOpen, User } from "lucide-react";
import UnifiedSidebar from "../../../components/UnifiedSidebar.jsx";
import { apiRequest } from "../../../api.js";

export default function CandidateSidebar({ mobileOpen, onCloseMobile }) {
  const [offerBadge, setOfferBadge] = useState(null);

  useEffect(() => {
    let active = true;
    apiRequest("/candidate/offer")
      .then(res => {
        if (!active) return;
        const offer = res.data;
        if (offer && (offer.status === "sent" || offer.status === "offer_received")) {
          setOfferBadge("New");
        } else if (offer && offer.status === "accepted") {
          setOfferBadge("Accepted");
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const candidateTabs = [
    { label: "Overview", path: "/candidate", icon: LayoutDashboard, end: true },
    { label: "My Application", path: "/candidate/application", icon: FileText },
    {
      label: "My Offer",
      path: "/candidate/offer",
      icon: Award,
      badge: offerBadge,
      badgeAlert: offerBadge === "New",
    },
    { label: "My Documents", path: "/candidate/documents", icon: FolderOpen },
    { label: "My Profile", path: "/candidate/profile", icon: User },
  ];

  return (
    <UnifiedSidebar
      roleTitle="Candidate Portal"
      tabs={candidateTabs}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    />
  );
}
