import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";
import { useAlert } from "../components/AlertProvider.jsx";

export default function useRoleAuth(role) {
  const alert = useAlert();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Checking account...");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("hr-auth-token") || "");

  useEffect(() => {
    let isMounted = true;
    const currentToken = localStorage.getItem("hr-auth-token");

    if (!currentToken) {
      navigate("/login", { replace: true });
      return () => {
        isMounted = false;
      };
    }

    async function checkRole() {
      try {
        const result = await apiRequest("/auth/me", {
          headers: { Authorization: `Bearer ${currentToken}` },
        });

        if (!isMounted) return;

        const authenticatedUser = result.user || result.data?.user;
        const roleMatches =
          authenticatedUser?.role === role ||
          (role === "candidate" && ["intern", "employee"].includes(authenticatedUser?.role)) ||
          ((role === "intern" || role === "employee") && authenticatedUser?.role === "candidate");

        if (!authenticatedUser || !roleMatches) {
          console.error("Role mismatch or missing user in authentication response.", {
            expected: role,
            received: authenticatedUser?.role,
          });
          navigate("/login", { replace: true });
          return;
        }

        setUser(authenticatedUser);
        setToken(currentToken);
        setMessage(
          `Signed in as ${authenticatedUser.name || authenticatedUser.email}.`
        );
        setIsAuthenticated(true);
      } catch (error) {
        if (!isMounted) return;

        console.error("Authentication check failed:", error.message);
        if (error.status === 401 || error.status === 403) {
          localStorage.removeItem("hr-auth-token");
          setToken("");
        }
        navigate("/login", { replace: true });
      }
    }

    checkRole();

    return () => {
      isMounted = false;
    };
  }, [navigate, role]);

  async function logout() {
    const confirmed = await alert.confirm({
      title: "Log out?",
      message: "You will be returned to the login screen.",
      type: "warning",
      confirmText: "Log out",
    });
    if (!confirmed) return;

    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Unable to complete logout request:", error.message);
    }

    localStorage.removeItem("hr-auth-token");
    setToken("");
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  }

  return { message, logout, isAuthenticated, user, token };
}
