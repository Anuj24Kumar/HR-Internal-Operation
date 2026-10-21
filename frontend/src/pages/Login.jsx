import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiRequest } from "../api.js";
import { roles } from "../roles.js";
import RoleEntry from "../roles/RoleEntry.jsx";

export default function Login() {
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", role: "candidate" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [destinationRole, setDestinationRole] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const user = result.user || result.data?.user;
      const token = result.token || result.data?.token;
      if (!user || !token) {
        throw new Error("The server response did not include a user and token.");
      }
      if (user.role !== form.role) {
        throw new Error(`This account belongs to the ${user.role} role. Select that role to continue.`);
      }
      localStorage.setItem("hr-auth-token", token);
      setDestinationRole(user.role);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (destinationRole) {
    return <RoleEntry role={destinationRole} />;
  }

  return (
    <main className="form-page">
      <form className="simple-form" onSubmit={handleSubmit}>
        <h1>Login</h1>
        {location.state?.message && <p role="status">{location.state.message}</p>}
        <label>
          Role
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            {roles.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p>Candidate account? <Link to="/signup">Sign up</Link></p>
      </form>
    </main>
  );
}
