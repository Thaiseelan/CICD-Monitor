import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import SidebarLayout from "../components/SidebarLayout";
import StatusBadge from "../components/StatusBadge";
import LogsViewer from "../components/LogsViewer";

const cardStyle = {
  padding: 22,
  borderRadius: 22,
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.88))",
  boxShadow: "0 18px 48px rgba(2, 6, 23, 0.3)",
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#94a3b8",
};

const valueStyle = {
  margin: 0,
  color: "#f8fafc",
};

export default function BuildDetails() {
  const { id } = useParams();
  const [build, setBuild] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildRes, logsRes] = await Promise.all([
          api.get(`/builds/${id}`),
          api.get(`/logs/${id}`),
        ]);
        setBuild(buildRes.data);
        setLogs(logsRes.data);
      } catch (err) {
        setError("Failed to load build details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <SidebarLayout><div>Loading...</div></SidebarLayout>;
  if (error) return <SidebarLayout><div>{error}</div></SidebarLayout>;
  if (!build) return <SidebarLayout><div>Build not found</div></SidebarLayout>;

  const commitShort = build.commitId ? build.commitId.slice(0, 7) : "N/A";
  const commitMessage = build.message?.trim() || "No commit message recorded for this build.";

  return (
    <SidebarLayout>
      <header
        style={{
          marginBottom: 18,
          padding: 24,
          borderRadius: 24,
          border: "1px solid rgba(56, 189, 248, 0.12)",
          background:
            "radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 28%), linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(2, 6, 23, 0.94))",
          boxShadow: "0 22px 60px rgba(2, 6, 23, 0.32)",
        }}
      >
        <Link to="/builds" style={{ color: "#7dd3fc", textDecoration: "none" }}>
          {"<- Back to Builds"}
        </Link>
        <h2 style={{ margin: "8px 0", color: "#e5e7eb" }}>Build Details</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
          Repository: {build.repositoryName} | Branch: {build.branch} | Commit: {commitShort}
        </p>
        <p style={{ margin: "12px 0 0", fontSize: 15, color: "#f8fafc", maxWidth: 860 }}>
          <span style={labelStyle}>Commit Message</span>
          {commitMessage}
        </p>
      </header>

      <div className="build-details-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, color: "#f8fafc" }}>Build Info</h3>
          <p style={valueStyle}><strong style={{ color: "#cbd5e1" }}>Status:</strong> <StatusBadge status={build.status} /></p>
          <p style={valueStyle}><strong style={{ color: "#cbd5e1" }}>Author:</strong> {build.author || "Unknown"}</p>
          <p style={valueStyle}><strong style={{ color: "#cbd5e1" }}>Commit SHA:</strong> {build.commitId || "N/A"}</p>
          <p style={valueStyle}><strong style={{ color: "#cbd5e1" }}>Started:</strong> {build.startedAt ? new Date(build.startedAt).toLocaleString() : "N/A"}</p>
          <p style={valueStyle}><strong style={{ color: "#cbd5e1" }}>Finished:</strong> {build.finishedAt ? new Date(build.finishedAt).toLocaleString() : "N/A"}</p>
          <p style={valueStyle}><strong style={{ color: "#cbd5e1" }}>Duration:</strong> {build.duration ? `${build.duration} ms` : "N/A"}</p>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 6, color: "#f8fafc" }}>Logs</h3>
        <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: 13 }}>
          A simple event stream for this run with the newest line pinned at the bottom.
        </p>
        <LogsViewer logs={logs} />
      </div>
    </SidebarLayout>
  );
}
