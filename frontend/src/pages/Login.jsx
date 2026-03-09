import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data?.token;
      if (token) {
        localStorage.setItem("token", token);
        navigate("/dashboard", { replace: true });
      } else {
        setError("Login failed: no token returned.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid credentials or server error."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-visual">
          <div className="auth-glow auth-glow--one" />
          <div className="auth-glow auth-glow--two" />
          <div className="auth-hero-copy">
            <h2>Watch every build, live.</h2>
            <p>
              A focused CI/CD observability cockpit with real-time health,
              duration trends, and AI-assisted incident summaries.
            </p>
          </div>
        </div>

        <div className="auth-form">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">
            Sign in to access your pipelines and insights.
          </p>

          {error && <div className="auth-alert auth-alert--error">{error}</div>}

          <form onSubmit={handleSubmit}>
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="auth-footer">
            New here?{" "}
            <span
              role="button"
              tabIndex={0}
              onClick={() => navigate("/register")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/register")}
            >
              Create an account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
