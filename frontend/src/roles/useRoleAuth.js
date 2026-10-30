import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";

export default function useRoleAuth(role) {
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
        if (!authenticatedUser || authenticatedUser.role !== role) {
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

  function logout() {
    localStorage.removeItem("hr-auth-token");
    setToken("");
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  }

  return { message, logout, isAuthenticated, user, token };
}
