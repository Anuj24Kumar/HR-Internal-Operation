import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../api.js";
import UnifiedNavbar from "../../../components/UnifiedNavbar.jsx";

export default function CandidateNavbar({ userMessage, onLogout, onToggleMobile }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("hr-auth-token");
    if (!token) return;

    let cancelled = false;

    apiRequest("/candidates/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((result) => {
        if (!cancelled) {
          setProfile(result.profile);
        }
      })
      .catch((error) => {
        console.error("Unable to load candidate profile:", error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    profile?.name ||
    userMessage?.replace(/^Signed in as /, "") ||
    "Candidate";

  const user = {
    name: fullName,
    email: profile?.email,
    profileImage: profile?.profileImage,
    role: "candidate",
  };

  const notifications = [
    { id: 1, title: "Application Active", message: "Review your interview stages and documents." },
  ];

  return (
    <UnifiedNavbar
      user={user}
      roleLabel="Candidate"
      onViewProfile={() => navigate("/candidate/profile")}
      onLogout={onLogout}
      notifications={notifications}
      onToggleMobile={onToggleMobile}
    />
  );
}
