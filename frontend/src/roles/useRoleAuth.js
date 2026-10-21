import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";

export default function useRoleAuth(role) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Checking account...");

  useEffect(() => {
    const token = localStorage.getItem("hr-auth-token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    apiRequest("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((result) => {
        if (result.user?.role !== role) {
          throw new Error("The signed-in account does not match this role page.");
        }
        setMessage(`Signed in as ${result.user.name || result.user.email}.`);
      })
      .catch(() => {
        localStorage.removeItem("hr-auth-token");
        navigate("/login", { replace: true });
      });
  }, [navigate, role]);

  function logout() {
    localStorage.removeItem("hr-auth-token");
    navigate("/login", { replace: true });
  }

  return { message, logout };
}
