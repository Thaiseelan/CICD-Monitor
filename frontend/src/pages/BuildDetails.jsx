import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import SidebarLayout from "../components/SidebarLayout";
import StatusBadge from "../components/StatusBadge";
import LogsViewer from "../components/LogsViewer";

export default function BuildDetails() {
  const { id } = useParams();
  const [build, setBuild] = useState(null);
  const [logs, setLogs] = useState([]);
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildRes, logsRes, insightRes] = await Promise.all([
          api.get(`/builds/${id}`),
          api.get(`/logs/${id}`),
          api.get(`/ai-insights/${id}`)
        ]);
        setBuild(buildRes.data);
        setLogs(logsRes.data);
        setInsight(insightRes.data.insight || "");
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

  return (
    <SidebarLayout>
      <header style={{ marginBottom: 18 }}>
        <Link to="/builds" style={{ color: "#3b82f6", textDecoration: "none" }}>← Back to Builds</Link>
        <h2 style={{ margin: "8px 0", color: "#e5e7eb" }}>Build Details</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
          Repository: {build.repositoryName} | Branch: {build.branch} | Commit: {build.commitId.slice(0, 7)}
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          <h3>Build Info</h3>
          <p><strong>Status:</strong> <StatusBadge status={build.status} /></p>
          <p><strong>Author:</strong> {build.author}</p>
          <p><strong>Message:</strong> {build.message}</p>
          <p><strong>Started:</strong> {build.startedAt ? new Date(build.startedAt).toLocaleString() : "N/A"}</p>
          <p><strong>Finished:</strong> {build.finishedAt ? new Date(build.finishedAt).toLocaleString() : "N/A"}</p>
          <p><strong>Duration:</strong> {build.duration ? `${build.duration}ms` : "N/A"}</p>
        </div>

        <div style={{ background: "#ffffff", padding: 20, borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          <h3>AI Insight</h3>
          {insight ? (
            <div style={{ whiteSpace: "pre-wrap", fontSize: 14 }}>
              {insight}
            </div>
          ) : (
            <p>No insight available</p>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, background: "#ffffff", padding: 20, borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <h3>Logs</h3>
        <LogsViewer logs={logs} />
      </div>
    </SidebarLayout>
  );
}