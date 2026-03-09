import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/auth/register", { name, email, password });
      setSuccess("Account created. Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-visual auth-visual--register">
          <div className="auth-orbit auth-orbit--one" />
          <div className="auth-orbit auth-orbit--two" />
          <div className="auth-orbit auth-orbit--three" />
          <div className="auth-hero-copy">
            <h2>Spin up observability in minutes.</h2>
            <p>
              Create an account to track builds, spot regressions, and let AI
              explain what&apos;s really happening in your pipelines.
            </p>
          </div>
        </div>

        <div className="auth-form">
          <h1>Create your account</h1>
          <p className="auth-subtitle">
            One login for dashboards, pipelines, and insights.
          </p>

          {error && <div className="auth-alert auth-alert--error">{error}</div>}
          {success && (
            <div className="auth-alert auth-alert--success">{success}</div>
          )}

          <form onSubmit={handleSubmit}>
            <label>
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Alex DevOps"
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

