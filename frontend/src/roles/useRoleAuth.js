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
    const currentToken = localStorage.getItem("hr-auth-token");
    if (!currentToken) {
      navigate("/login", { replace: true });
      return;
    }

    apiRequest("/auth/me", {
      headers: { Authorization: `Bearer ${currentToken}` },
    })
      .then((result) => {
        const u = result.user || result.data?.user;
        if (!u || u.role !== role) {
          throw new Error("The signed-in account does not match this role page.");
        }
        setUser(u);
        setToken(currentToken);
        setMessage(`Signed in as ${u.name || u.email}.`);
        setIsAuthenticated(true);
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

  return { message, logout, isAuthenticated, user, token };
}
