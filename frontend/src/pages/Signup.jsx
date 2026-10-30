import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Briefcase,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "../api.js";
import "./auth.css";

const COMMON_POSITIONS = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Engineer",
  "DevOps Engineer",
  "Product Manager",
  "UI/UX Designer",
  "HR Operations Specialist",
  "Finance Analyst",
  "Quality Assurance Engineer",
];

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

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

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
        state: {
          message: "Candidate account created successfully! Please sign in to access your portal.",
        },
      });
    } catch (requestError) {
      setError(requestError.message || "Account registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card auth-card-lg">
        {/* Brand & Heading */}
        <div className="auth-header">
          <div className="auth-brand">
            <div className="auth-brand-icon">P</div>
            <span className="auth-brand-text">PeopleOps</span>
          </div>
          <h1 className="auth-title">Candidate Registration</h1>
          <p className="auth-subtitle">
            Apply and track your recruitment stages, documents, and offers
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-alert auth-alert-error" style={{ marginBottom: "16px" }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          {/* First & Last Name Row */}
          <div className="auth-row-2">
            <div className="auth-field">
              <label className="auth-label">First name *</label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input
                  name="firstName"
                  type="text"
                  required
                  placeholder="John"
                  className="auth-input has-icon"
                  value={form.firstName}
                  onChange={updateField}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Last name *</label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input
                  name="lastName"
                  type="text"
                  required
                  placeholder="Doe"
                  className="auth-input has-icon"
                  value={form.lastName}
                  onChange={updateField}
                />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div className="auth-field">
            <label className="auth-label">Email address *</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="john.doe@example.com"
                className="auth-input has-icon"
                value={form.email}
                onChange={updateField}
              />
            </div>
          </div>

          {/* Phone & Position Row */}
          <div className="auth-row-2">
            <div className="auth-field">
              <label className="auth-label">Phone number</label>
              <div className="auth-input-wrap">
                <Phone size={16} className="auth-input-icon" />
                <input
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="auth-input has-icon"
                  value={form.phone}
                  onChange={updateField}
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Position applying for *</label>
              <div className="auth-input-wrap">
                <Briefcase size={16} className="auth-input-icon" />
                <input
                  name="position"
                  list="position-suggestions"
                  autoComplete="organization-title"
                  required
                  placeholder="e.g. Software Engineer"
                  className="auth-input has-icon"
                  value={form.position}
                  onChange={updateField}
                />
                <datalist id="position-suggestions">
                  {COMMON_POSITIONS.map((pos) => (
                    <option key={pos} value={pos} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div className="auth-field">
            <label className="auth-label">
              <span>Password *</span>
              <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: "normal" }}>
                Min 8 characters
              </span>
            </label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••••••"
                className="auth-input has-icon has-toggle"
                value={form.password}
                onChange={updateField}
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
                <span>Creating candidate account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="auth-footer">
          Already registered?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
