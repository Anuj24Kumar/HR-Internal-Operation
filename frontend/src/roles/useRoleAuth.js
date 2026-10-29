import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";

export default function useRoleAuth(role) {
const navigate = useNavigate();
const [message, setMessage] = useState("Checking account...");

useEffect(() => {
let isMounted = true;


const token = localStorage.getItem("hr-auth-token");

if (!token) {
  navigate("/login", { replace: true });
  return;
}

async function checkRole() {
  try {
    const result = await apiRequest("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!isMounted) return;

    if (result.user?.role !== role) {
      console.error("Role mismatch:", {
        expected: role,
        received: result.user?.role,
      });

      navigate("/login", { replace: true });
      return;
    }

    setMessage(
      `Signed in as ${
        result.user.name || result.user.email || role
      }.`
    );
  } catch (error) {
    if (!isMounted) return;

    console.error("Authentication check failed:", error.message);

    // Clear the token only when authentication is actually rejected.
    if (
      /token|unauthorized|authentication|jwt|session expired/i.test(
        error.message
      )
    ) {
      localStorage.removeItem("hr-auth-token");
    }

    navigate("/login", { replace: true });
  }
}

checkRole();

return () => {
  isMounted = false;
};


}, [navigate, role]);

function logout() {
localStorage.removeItem("hr-auth-token");
navigate("/login", { replace: true });
}

return { message, logout };
}
