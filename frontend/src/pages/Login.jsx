import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { apiRequest } from "../api.js";
import { roles } from "../roles.js";
import "./auth.css";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "", // "" means auto-detect from user profile
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);


    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });


      const user = result.user || result.data?.user;
      const token = result.token || result.data?.token;


      if (!user || !token) {
        throw new Error("The server response did not include an authentication token.");
        throw new Error("The server response did not include an authentication token.");
      }

      // Check role mismatch if a specific role was selected
      if (form.role && form.role !== user.role) {
        throw new Error(
          `This account belongs to the "${user.role}" role. Please switch role or select Auto-detect.`
        );
      }

      // Save token to localStorage
      localStorage.setItem("hr-auth-token", token);

      // Determine destination route
      const destinationPath =
        user.role === "hiring_manager" ? "hiring-manager" : user.role;

      navigate(`/${destinationPath}`, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAccount(email, password, role) {
    setForm({ email, password, role });
    setError("");
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        {/* Brand & Heading */}
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-brand-icon">P</div>
            <span className="auth-brand-text">PeopleOps</span>
          </div>
          <h1 className="auth-title">Sign in to your account</h1>
          <p className="auth-subtitle">
            Enterprise human resources & operations workspace
          </p>
        </div>

        {/* Success / Info Status from redirect */}
        {location.state?.message && (
          <div className="auth-alert auth-alert-success" style={{ marginBottom: "16px" }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{location.state.message}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="auth-alert auth-alert-error" style={{ marginBottom: "16px" }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Target Role Selector */}
          <div className="auth-field">
            <label className="auth-label">
              <span>Target Role (Optional)</span>
            </label>
            <select
              className="auth-select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="">Auto-detect from account</option>
              {roles.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Email Field */}
          <div className="auth-field">
            <label className="auth-label">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@company.com"
                className="auth-input has-icon"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="auth-field">
            <label className="auth-label">
              <span>Password</span>
            </label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="auth-input has-icon has-toggle"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick Fill */}
        <div className="auth-demo-box">
          <div className="auth-demo-title">
            <ShieldCheck size={14} style={{ color: "#2563eb" }} />
            <span>Database Accounts</span>
          </div>
          <div className="auth-demo-pills">
            <button
              type="button"
              className="auth-demo-pill"
              onClick={() => fillDemoAccount("admin@hrplatform.com", "admin123", "admin")}
            >
              👑 Admin (admin@hrplatform.com)
            </button>
            <button
              type="button"
              className="auth-demo-pill"
              onClick={() => fillDemoAccount("admin@company.com", "Admin@12345", "admin")}
            >
              👑 Admin (admin@company.com)
            </button>
            <button
              type="button"
              className="auth-demo-pill"
              onClick={() => fillDemoAccount("hr@company.com", "HR@12345", "hr")}
            >
              💼 HR (hr@company.com)
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-link">
            Apply as Candidate
          </Link>
        </div>
      </div>
    </main>
  );
}
