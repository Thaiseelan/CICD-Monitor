import { useEffect, useState } from "react";
import api from "../api/api";
import SidebarLayout from "../components/SidebarLayout";
import LogsViewer from "../components/LogsViewer";

export default function LogsPage() {
  const [builds, setBuilds] = useState([]);
  const [selectedBuildId, setSelectedBuildId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch all builds
  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const res = await api.get("/builds");
        setBuilds(res.data);
        if (res.data.length > 0) {
          setSelectedBuildId(res.data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load builds", err);
      }
    };
    fetchBuilds();
  }, []);

  // Fetch logs for selected build
  useEffect(() => {
    if (!selectedBuildId) return;

    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const res = await api.get(`/logs/${selectedBuildId}`);
        console.log("Logs response:", res.data);
        setLogs(res.data || []);
      } catch (err) {
        console.error("Failed to load logs:", err);
        setLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchLogs();
  }, [selectedBuildId]);

  const selectedBuild = builds.find(b => b._id === selectedBuildId);

  return (
    <SidebarLayout>
      <header style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Logs</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
          View detailed build logs for each pipeline run.
        </p>
      </header>

      <div
        className="logs-page-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        {/* Builds list */}
        <div
          className="logs-builds-panel"
          style={{
            background: "#020617",
            borderRadius: 12,
            border: "1px solid rgba(31,41,55,0.9)",
            boxShadow: "0 3px 12px rgba(15,23,42,0.8)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(31,41,55,0.9)",
              fontSize: 13,
              color: "#9ca3af",
            }}
          >
            Builds
          </div>
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
            {builds.length === 0 && (
              <p
                style={{
                  padding: 16,
                  margin: 0,
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                No builds yet.
              </p>
            )}
            {builds.map((b) => {
              const isActive = b._id === selectedBuildId;
              return (
                <button
                  key={b._id}
                  type="button"
                  onClick={() => setSelectedBuildId(b._id)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    textAlign: "left",
                    fontSize: 12,
                    background: isActive ? "#374151" : "transparent",
                    color: isActive ? "#fff" : "#9ca3af",
                    border: "none",
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(31,41,55,0.9)",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{ fontWeight: 500 }}>
                    {b.repositoryName || "Unknown"} #{b._id?.slice(-6)}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>
                    {b.status} · {new Date(b.createdAt).toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Logs viewer */}
        <div>
          {selectedBuild && (
            <div style={{ marginBottom: 12 }}>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: 14,
                  color: "#e5e7eb",
                }}
              >
                {selectedBuild.repositoryName} - {selectedBuild.branch}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                Status: <span style={{ color: selectedBuild.status === "success" ? "#10b981" : selectedBuild.status === "failed" ? "#ef4444" : "#3b82f6" }}>
                  {selectedBuild.status}
                </span>
              </p>
            </div>
          )}
          {loadingLogs && (
            <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading logs...</p>
          )}
          {!loadingLogs && <LogsViewer logs={logs} />}
        </div>
      </div>
    </SidebarLayout>
  );
}
