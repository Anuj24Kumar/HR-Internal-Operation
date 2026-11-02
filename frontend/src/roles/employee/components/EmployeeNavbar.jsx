import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../api.js";
import UnifiedNavbar from "../../../components/UnifiedNavbar.jsx";

export default function EmployeeNavbar({ userMessage, onLogout, onToggleMobile }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("hr-auth-token");
    if (!token) return;

    let cancelled = false;

    apiRequest("/employee/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((result) => {
        if (!cancelled) {
          setProfile(result.employee);
        }
      })
      .catch((error) => {
        console.error("Unable to load employee profile:", error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fullName =
    [profile?.user?.firstName, profile?.user?.lastName].filter(Boolean).join(" ") ||
    profile?.user?.name ||
    userMessage?.replace(/^Signed in as /, "") ||
    "Employee";

  const user = {
    name: fullName,
    email: profile?.user?.email,
    profileImage: profile?.user?.profileImage,
    role: "employee",
  };

  const notifications = [
    { id: 1, title: "Payroll Notice", message: "Latest payslip and tax summary are available." },
  ];

  return (
    <UnifiedNavbar
      user={user}
      roleLabel="Employee"
      onViewProfile={() => navigate("/employee/profile")}
      onLogout={onLogout}
      notifications={notifications}
      onToggleMobile={onToggleMobile}
    />
  );
}
