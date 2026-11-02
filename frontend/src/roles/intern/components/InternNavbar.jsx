import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../api.js";
import UnifiedNavbar from "../../../components/UnifiedNavbar.jsx";

export default function InternNavbar({ userMessage, onLogout, onToggleMobile }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("hr-auth-token");
    if (!token) return;

    let cancelled = false;

    apiRequest("/intern/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((result) => {
        if (!cancelled) {
          setProfile(result.intern);
        }
      })
      .catch((error) => {
        console.error("Unable to load intern profile:", error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const userObj = profile?.user;
  const fullName =
    [userObj?.firstName, userObj?.lastName].filter(Boolean).join(" ") ||
    userObj?.name ||
    userObj?.email ||
    userMessage?.replace(/^Signed in as /, "") ||
    "Intern";

  const user = {
    name: fullName,
    email: userObj?.email,
    profileImage: userObj?.profileImage,
    role: "intern",
  };

  const notifications = [
    { id: 1, title: "Onboarding Checklist", message: "Review pending onboarding tasks." },
  ];

  return (
    <UnifiedNavbar
      user={user}
      roleLabel="Intern"
      onViewProfile={() => navigate("/intern/profile")}
      onLogout={onLogout}
      notifications={notifications}
      onToggleMobile={onToggleMobile}
    />
  );
}
