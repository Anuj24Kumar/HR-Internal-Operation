import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";
import { roles } from "../roles.js";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      navigate("/login", {
        replace: true,
        state: { message: "Candidate account created. Log in to continue." },
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
    <main className="form-page">
      <form className="simple-form" onSubmit={handleSubmit}>
        <h1>Candidate sign up</h1>
        <p>Self-service registration creates a candidate account.</p>
        <label>First name<input name="firstName" required value={form.firstName} onChange={updateField} /></label>
        <label>Last name<input name="lastName" required value={form.lastName} onChange={updateField} /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required value={form.email} onChange={updateField} /></label>
        <label>Phone<input name="phone" type="tel" value={form.phone} onChange={updateField} /></label>
        <label>
          Position applying for
          <select name="position" required value={form.position} onChange={updateField}>
            <option value="" disabled>Select a position</option>
            {roles.map(([value, label]) => (
              <option key={value} value={label}>{label}</option>
            ))}
          </select>
        </label>
        <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required value={form.password} onChange={updateField} /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
        <p>Already registered? <Link to="/login">Login</Link></p>
      </form>
    </main>
  );
}
