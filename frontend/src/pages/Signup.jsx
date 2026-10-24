import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { apiRequest } from "../api.js";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          position: form.position.trim(),
          password: form.password,
        }),
      });

      navigate("/login", {
        replace: true,
        state: { message: "Candidate profile successfully created! You can now log in." },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ maxWidth: "520px" }}>
        <header className="auth-header">
          <div className="auth-logo-badge">
            <svg className="auth-logo-icon" viewBox="0 0 32 36" fill="none" aria-hidden="true">
              <path d="M3 3h13c9 0 14 5 14 12s-5 12-14 12h-5v7H3V3Z" fill="currentColor" />
              <path d="M11 11h5c3 0 5 1 5 4s-2 4-5 4h-5v-8Z" fill="#111827" />
              <path d="M3 27h8v7H3z" fill="#818cf8" />
            </svg>
            <span>PeopleOps</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: "#9ca3af", fontWeight: 400 }}>Acme Careers</span>
          </div>
          <h1 className="auth-title">Candidate registration</h1>
          <p className="auth-subtitle">Create your application profile to track interviews & offers</p>
        </header>

        {error && (
          <div className="auth-error" style={{ marginBottom: "16px" }} role="alert">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Name fields row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First name</label>
              <div className="input-wrapper">
                <User className="input-icon-left" size={16} />
                <input
                  id="firstName"
                  name="firstName"
                  required
                  placeholder="Jane"
                  className="form-input input-with-left-icon"
                  value={form.firstName}
                  onChange={updateField}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last name</label>
              <div className="input-wrapper">
                <input
                  id="lastName"
                  name="lastName"
                  required
                  placeholder="Doe"
                  className="form-input"
                  value={form.lastName}
                  onChange={updateField}
                />
              </div>
            </div>
          </div>

          {/* Email field */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email address</label>
            <div className="input-wrapper">
              <Mail className="input-icon-left" size={16} />
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="jane.doe@example.com"
                className="form-input input-with-left-icon"
                value={form.email}
                onChange={updateField}
              />
            </div>
          </div>

          {/* Phone field */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-phone">Phone number</label>
            <div className="input-wrapper">
              <Phone className="input-icon-left" size={16} />
              <input
                id="signup-phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="form-input input-with-left-icon"
                value={form.phone}
                onChange={updateField}
              />
            </div>
          </div>

          {/* Position field */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-position">Position applying for</label>
            <div className="input-wrapper">
              <Briefcase className="input-icon-left" size={16} />
              <input
                id="signup-position"
                name="position"
                placeholder="e.g. Senior Frontend Engineer"
                required
                className="form-input input-with-left-icon"
                value={form.position}
                onChange={updateField}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">
              <span>Password</span>
              <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>Min 8 characters</span>
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon-left" size={16} />
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                placeholder="Create a secure password"
                className="form-input input-with-left-icon input-with-right-icon"
                value={form.password}
                onChange={updateField}
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

          <div style={{ fontSize: "12px", color: "var(--muted-foreground)", lineHeight: "1.4" }}>
            Note: Public registration creates a candidate portal account. Employee, Hiring Manager, and Interviewer accounts are provisioned by enterprise administration.
          </div>

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? (
              <span>Creating Candidate Profile...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <footer className="auth-footer">
          <span>Already have an account? </span>
          <Link to="/login" className="auth-link">Sign in here</Link>
        </footer>
      </div>
    </main>
  );
}
