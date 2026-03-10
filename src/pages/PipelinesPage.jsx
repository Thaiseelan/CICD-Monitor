import { useEffect, useState } from "react";
import api from "../api/api";
import SidebarLayout from "../components/SidebarLayout";
import StatusBadge from "../components/StatusBadge";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pipeRes, projRes] = await Promise.all([
          api.get("/pipelines"),
          api.get("/projects")
        ]);
        console.log("Pipelines response:", pipeRes.data);
        console.log("Projects response:", projRes.data);
        setPipelines(pipeRes.data);
        setProjects(projRes.data);
      } catch (err) {
        console.error("Failed to load pipelines:", err);
      }
    };
    fetchData();
  }, []);

  const getProjectName = (projectId) => {
    const proj = projects.find(p => p._id === projectId);
    return proj ? proj.name : "Unknown";
  };

  return (
    <SidebarLayout>
      <div style={{ padding: 0 }}>
        <h2 style={{ marginBottom: "8px" }}>Pipelines</h2>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>
          Per-project pipeline health and recent runs.
        </p>

        <div style={{ marginTop: 20, background: "#ffffff", padding: 20, borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Project</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Branch</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Triggered By</th>
                <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {pipelines.map((p) => (
                <tr key={p._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "14px 16px", fontWeight: "500", color: "#111827" }}>
                    {getProjectName(p.project)}
                  </td>
                  <td style={{ padding: "14px 16px", color: "#6b7280" }}>{p.branch}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ padding: "14px 16px", color: "#6b7280" }}>{p.triggeredBy}</td>
                  <td style={{ padding: "14px 16px", color: "#6b7280" }}>
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pipelines.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af" }}>No pipelines yet.</p>}
        </div>
      </div>
    </SidebarLayout>
  );
}

