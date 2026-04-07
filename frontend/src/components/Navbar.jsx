import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: "1px solid #e5e7eb",
        background: "#0f172a",
        color: "#e5e7eb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "999px",
            background:
              "radial-gradient(circle at 30% 0, #f97316, #a855f7 55%, #22d3ee 100%)",
            display: "inline-block",
          }}
        />
        <span style={{ fontWeight: 700, letterSpacing: 0.4 }}>
          CI/CD Monitor
        </span>
      </div>

      <nav style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <Link
          to="/dashboard"
          style={{ fontSize: 14, color: "#e5e7eb", textDecoration: "none" }}
        >
          Dashboard
        </Link>
        <Link
          to="/builds"
          style={{ fontSize: 14, color: "#e5e7eb", textDecoration: "none" }}
        >
          Builds
        </Link>
        <Link
          to="/logs"
          style={{ fontSize: 14, color: "#e5e7eb", textDecoration: "none" }}
        >
          Logs
        </Link>
        <Link
          to="/projects"
          style={{ fontSize: 14, color: "#e5e7eb", textDecoration: "none" }}
        >
          Projects
        </Link>
        <Link
          to="/pipelines"
          style={{ fontSize: 14, color: "#e5e7eb", textDecoration: "none" }}
        >
          Pipelines
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            borderRadius: "999px",
            border: "1px solid rgba(148, 163, 184, 0.5)",
            backgroundColor: "transparent",
            color: "#e5e7eb",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </nav>
    </header>
  );
}

