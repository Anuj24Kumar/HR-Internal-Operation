import { Navigate } from "react-router-dom";

export default function RoleEntry({ role }) {
  const path = role === "hiring_manager" ? "hiring-manager" : role;

  return <Navigate to={`/${path}`} replace />;
}
