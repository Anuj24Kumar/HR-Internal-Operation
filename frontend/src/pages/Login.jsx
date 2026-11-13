import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Zap, X, KeyRound } from "lucide-react";
import { apiRequest } from "../api.js";
import { roles } from "../roles.js";
import AuthShowcase from "./AuthShowcase.jsx";
import "./auth.css";

const DEMO_ACCOUNTS = [
  { role: "admin", label: "Admin", email: "admin@company.com", password: "Admin@12345", icon: "👑" },
  { role: "hr", label: "HR", email: "hr@company.com", password: "HR@12345", icon: "💼" },
  { role: "hiring_manager", label: "Hiring Manager", email: "manager@company.com", password: "Manager@123", icon: "👔" },
  { role: "interviewer", label: "Interviewer", email: "interviewer@company.com", password: "Interviewer@123", icon: "📋" },
  { role: "employee", label: "Employee", email: "employee@company.com", password: "Employee@123", icon: "👤" },
  { role: "intern", label: "Intern", email: "intern@company.com", password: "Intern@123", icon: "🎓" },
  { role: "candidate", label: "Candidate", email: "candidate@company.com", password: "Candidate@123", icon: "📄" },
];

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

  // Forgot Password / Activation modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTab, setResetTab] = useState("request"); // "request" | "reset"
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");
  const [resetErrorMsg, setResetErrorMsg] = useState("");

  async function handleRequestToken(e) {
    e.preventDefault();
    setResetLoading(true);
    setResetErrorMsg("");
    setResetSuccessMsg("");
    try {
      const res = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setResetSuccessMsg(`Token generated: ${res.resetToken}. You can now set your new password.`);
        setResetTab("reset");
      } else {
        setResetSuccessMsg("Password reset request submitted. Check with administrator or your email.");
      }
    } catch (err) {
      setResetErrorMsg(err.message || "Failed to generate reset token.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleSetNewPassword(e) {
    e.preventDefault();
    setResetLoading(true);
    setResetErrorMsg("");
    setResetSuccessMsg("");
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: resetToken.trim(), newPassword }),
      });
      setShowResetModal(false);
      setForm((prev) => ({ ...prev, email: resetEmail || prev.email }));
      setError("");
      alert("Password updated successfully! Please sign in with your new password.");
    } catch (err) {
      setResetErrorMsg(err.message || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  }

  async function performLogin(email, password, role) {
    setError("");
    setLoading(true);

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const user = result.user || result.data?.user;
      const token = result.token || result.data?.token;

      if (!user || !token) {
        throw new Error("The server response did not include an authentication token.");
      }

      // Check role mismatch if a specific role was selected
      if (role && role !== user.role && !(role === "candidate" && ["intern", "employee"].includes(user.role))) {
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

  async function handleSubmit(event) {
    event.preventDefault();
    await performLogin(form.email, form.password, form.role);
  }

  function handleQuickLogin(account) {
    setForm({
      email: account.email,
      password: account.password,
      role: account.role,
    });
    performLogin(account.email, account.password, account.role);
  }

  return (
    <main className="auth-page">
      <AuthShowcase mode="login" />
      <section className="auth-panel">
      <div className="auth-card">
        {/* Brand & Heading */}
        <div className="auth-header">
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
            <label className="auth-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Password</span>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(form.email);
                  setResetErrorMsg("");
                  setResetSuccessMsg("");
                  setShowResetModal(true);
                }}
                className="auth-link"
                style={{ fontSize: "11px", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                Forgot / Activate?
              </button>
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

        {/* Quick Login Options */}
        <div className="auth-demo-box">
          <div className="auth-demo-title">
            <Zap size={14} style={{ color: "#2563eb" }} />
            <span>Quick 1-Click Login</span>
          </div>
          <p style={{ fontSize: "11.5px", color: "#64748b", margin: "4px 0 10px 0" }}>
            Click any role to auto-sign in immediately:
          </p>
          <div className="auth-demo-pills">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                className="auth-demo-pill"
                disabled={loading}
                onClick={() => handleQuickLogin(acc)}
                title={`Quick login as ${acc.label} (${acc.email})`}
              >
                <span>{acc.icon}</span> <span>{acc.label}</span>
              </button>
            ))}
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
        </section>

      {/* Password Reset & Activation Modal */}
      {showResetModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "24px",
            width: "100%",
            maxWidth: "420px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <KeyRound size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", color: "#0f172a" }}>
                  Reset / Activate Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginBottom: "16px", paddingBottom: "8px" }}>
              <button
                type="button"
                onClick={() => setResetTab("request")}
                style={{
                  background: resetTab === "request" ? "#2563eb" : "#f1f5f9",
                  color: resetTab === "request" ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                1. Request Token
              </button>
              <button
                type="button"
                onClick={() => setResetTab("reset")}
                style={{
                  background: resetTab === "reset" ? "#2563eb" : "#f1f5f9",
                  color: resetTab === "reset" ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                2. Set Password
              </button>
            </div>

            {resetErrorMsg && (
              <div className="auth-alert auth-alert-error" style={{ marginBottom: "12px", fontSize: "12px" }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>{resetErrorMsg}</span>
              </div>
            )}
            {resetSuccessMsg && (
              <div className="auth-alert auth-alert-success" style={{ marginBottom: "12px", fontSize: "12px" }}>
                <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            {resetTab === "request" ? (
              <form onSubmit={handleRequestToken}>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                  Enter your registered account email to generate a one-time activation/reset token.
                </p>
                <div className="auth-field" style={{ marginBottom: "16px" }}>
                  <label className="auth-label" style={{ fontSize: "12px" }}>Account Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    className="auth-input"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    style={{ fontSize: "13px" }}
                  />
                </div>
                <button type="submit" className="auth-btn-primary" disabled={resetLoading}>
                  {resetLoading ? "Generating Token..." : "Generate Token"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSetNewPassword}>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                  Paste the activation/reset token and choose your new secure password (min 8 characters).
                </p>
                <div className="auth-field" style={{ marginBottom: "12px" }}>
                  <label className="auth-label" style={{ fontSize: "12px" }}>Reset / Activation Token</label>
                  <input
                    type="text"
                    required
                    placeholder="Paste your 64-character token"
                    className="auth-input"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    style={{ fontSize: "13px" }}
                  />
                </div>
                <div className="auth-field" style={{ marginBottom: "16px" }}>
                  <label className="auth-label" style={{ fontSize: "12px" }}>New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className="auth-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ fontSize: "13px" }}
                  />
                </div>
                <button type="submit" className="auth-btn-primary" disabled={resetLoading}>
                  {resetLoading ? "Updating Password..." : "Update Password & Activate"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
