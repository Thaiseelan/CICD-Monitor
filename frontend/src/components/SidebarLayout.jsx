import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

function Sidebar({ onNavigate }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    if (onNavigate) onNavigate();
    navigate("/login", { replace: true });
  };

  const linkBase = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 13,
    color: "#9ca3af",
    textDecoration: "none",
  };

  return (
    <aside
      className="app-sidebar__panel"
      style={{
        width: 220,
        padding: "18px 16px",
        borderRight: "1px solid rgba(31, 41, 55, 0.9)",
        background:
          "radial-gradient(circle at top, rgba(15,23,42,1) 0, #020617 70%)",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div className="app-sidebar__brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: "999px",
            background:
              "radial-gradient(circle at 30% 0, #f97316, #a855f7 55%, #22d3ee 100%)",
          }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>CI/CD Monitor</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Intelligent health</div>
        </div>
      </div>

      <nav className="app-sidebar__nav" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", color: "#6b7280" }}>
          Overview
        </span>
        <NavLink
          to="/dashboard"
          style={({ isActive }) => ({
            ...linkBase,
            backgroundColor: isActive ? "rgba(37, 99, 235, 0.2)" : "transparent",
            color: isActive ? "#e5e7eb" : linkBase.color,
          })}
        >
          <span>📊</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/builds"
          style={({ isActive }) => ({
            ...linkBase,
            backgroundColor: isActive ? "rgba(34, 197, 94, 0.16)" : "transparent",
            color: isActive ? "#e5e7eb" : linkBase.color,
          })}
        >
          <span>🧱</span>
          <span>Builds</span>
        </NavLink>

        <NavLink
          to="/logs"
          style={({ isActive }) => ({
            ...linkBase,
            backgroundColor: isActive ? "rgba(239, 68, 68, 0.16)" : "transparent",
            color: isActive ? "#e5e7eb" : linkBase.color,
          })}
        >
          <span>📋</span>
          <span>Logs</span>
        </NavLink>

        <NavLink
          to="/projects"
          style={({ isActive }) => ({
            ...linkBase,
            backgroundColor: isActive ? "rgba(234, 179, 8, 0.18)" : "transparent",
            color: isActive ? "#e5e7eb" : linkBase.color,
          })}
        >
          <span>📂</span>
          <span>Projects</span>
        </NavLink>

        <NavLink
          to="/pipelines"
          style={({ isActive }) => ({
            ...linkBase,
            backgroundColor: isActive ? "rgba(249, 115, 22, 0.18)" : "transparent",
            color: isActive ? "#e5e7eb" : linkBase.color,
          })}
        >
          <span>🚀</span>
          <span>Pipelines</span>
        </NavLink>

        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            ...linkBase,
            backgroundColor: isActive ? "rgba(107, 114, 128, 0.18)" : "transparent",
            color: isActive ? "#e5e7eb" : linkBase.color,
          })}
        >
          <span>⚙️</span>
          <span>Settings</span>
        </NavLink>

        <span style={{ fontSize: 11, textTransform: "uppercase", color: "#6b7280", marginTop: 10 }}>
          Intelligence
        </span>
        <NavLink
          to="/ai-insights"
          style={({ isActive }) => ({
            ...linkBase,
            backgroundColor: isActive ? "rgba(168, 85, 247, 0.22)" : "transparent",
            color: isActive ? "#e5e7eb" : linkBase.color,
          })}
        >
          <span>🧠</span>
          <span>AI Insights</span>
        </NavLink>
      </nav>

      <div style={{ flex: 1 }} />

      <button
        className="app-sidebar__logout"
        type="button"
        onClick={handleLogout}
        style={{
          padding: "7px 12px",
          borderRadius: 999,
          border: "1px solid rgba(148, 163, 184, 0.6)",
          backgroundColor: "transparent",
          color: "#e5e7eb",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span>⏏</span>
        <span>Sign out</span>
      </button>
    </aside>
  );
}

export default function SidebarLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "radial-gradient(circle at top, #020617 0, #020617 50%, #000 100%)",
      }}
    >
      <header className="app-mobile-header">
        <div className="app-mobile-header__brand">
          <span className="app-mobile-header__mark" />
          <div>
            <div className="app-mobile-header__title">CI/CD Monitor</div>
            <div className="app-mobile-header__subtitle">Intelligent health</div>
          </div>
        </div>
        <button
          type="button"
          className="app-mobile-header__button"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </header>

      <button
        type="button"
        aria-label="Close navigation"
        className={`app-sidebar__overlay ${menuOpen ? "is-open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <div className={`app-sidebar ${menuOpen ? "is-open" : ""}`}>
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </div>
      <main
        className="app-main"
        style={{
          flex: 1,
          padding: "20px 26px",
          color: "#e5e7eb",
        }}
      >
        {children}
      </main>
    </div>
  );
}

