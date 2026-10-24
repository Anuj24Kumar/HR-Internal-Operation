import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2 
} from "lucide-react";
import { apiRequest } from "../api.js";
import { roles } from "../roles.js";
import RoleEntry from "../roles/RoleEntry.jsx";

export default function Login() {
  const location = useLocation();
  const [form, setForm] = useState({ 
    email: "", 
    password: "", 
    role: "hiring_manager" 
  });
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ 
          email: form.email.trim(), 
          password: form.password 
        }),
      });

      const user = result.user || result.data?.user;
      const token = result.token || result.data?.token;

      if (!user || !token) {
        throw new Error("The server response did not include an authentication token.");
      }

      if (user.role !== form.role) {
        throw new Error(`This account belongs to the "${user.role}" role. Please switch your selected role to match.`);
      }

      localStorage.setItem("hr-auth-token", token);
      setDestinationRole(user.role);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function setDemoCredentials(role, email, pass) {
    setForm({
      role,
      email,
      password: pass
    });
    setError("");
  }

  if (destinationRole) {
    return <RoleEntry role={destinationRole} />;
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <div className="auth-logo-badge">
            <svg className="auth-logo-icon" viewBox="0 0 32 36" fill="none" aria-hidden="true">
              <path d="M3 3h13c9 0 14 5 14 12s-5 12-14 12h-5v7H3V3Z" fill="currentColor" />
              <path d="M11 11h5c3 0 5 1 5 4s-2 4-5 4h-5v-8Z" fill="#111827" />
              <path d="M3 27h8v7H3z" fill="#818cf8" />
            </svg>
            <span>PeopleOps</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: "#9ca3af", fontWeight: 400 }}>Acme Corp</span>
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your PeopleOps workspace to continue</p>
        </header>

        {location.state?.message && (
          <div className="auth-success" style={{ marginBottom: "16px" }} role="status">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{location.state.message}</span>
          </div>
        )}

        {error && (
          <div className="auth-error" style={{ marginBottom: "16px" }} role="alert">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">
              <span>Select Your Role</span>
              <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Workspace Context</span>
            </label>
            <div className="role-pills-container">
              {roles.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`role-pill-btn ${form.role === value ? "active" : ""}`}
                  onClick={() => setForm({ ...form, role: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Email input */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Work Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon-left" size={16} />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                className="form-input input-with-left-icon"
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password input */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              <span>Password</span>
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon-left" size={16} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="form-input input-with-left-icon input-with-right-icon"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Quick Demo Credentials */}
          <div className="demo-credentials-box">
            <div className="demo-title">
              <Sparkles size={13} style={{ color: "#6366f1" }} />
              <span>Quick Test Access (Pre-seeded Accounts)</span>
            </div>
            <div className="demo-actions">
              <button
                type="button"
                className="demo-chip"
                onClick={() => setDemoCredentials("hiring_manager", "manager@company.com", "Manager@123")}
              >
                Hiring Manager (Sarah)
              </button>
              <button
                type="button"
                className="demo-chip"
                onClick={() => setDemoCredentials("interviewer", "interviewer@company.com", "Interviewer@123")}
              >
                Interviewer (David)
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <footer className="auth-footer">
          <span>Are you a candidate applicant? </span>
          <Link to="/signup" className="auth-link">Create candidate account</Link>
        </footer>
      </div>
    </main>
  );
}
