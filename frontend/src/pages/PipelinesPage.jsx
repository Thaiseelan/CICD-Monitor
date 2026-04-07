import { useQuery } from '@tanstack/react-query';
import api from "../api/api";
import SidebarLayout from "../components/SidebarLayout";
import StatusBadge from "../components/StatusBadge";

export default function PipelinesPage() {
  const { data: pipelines = [], isLoading: pipelinesLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const res = await api.get("/pipelines");
      return res.data;
    },
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get("/projects");
      return res.data;
    },
  });

  const isLoading = pipelinesLoading || projectsLoading;

  const getProjectName = (projectValue) => {
    if (projectValue && typeof projectValue === "object") {
      return projectValue.name || "Unknown";
    }

    const proj = projects.find(p => p._id === projectValue);
    return proj ? proj.name : "Unknown";
  };

  return (
    <SidebarLayout>
      <div style={{ padding: 0 }}>
        <h2 style={{ marginBottom: "8px" }}>Pipelines</h2>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>
          Live status for each tracked project branch.
        </p>

        <div className="table-card" style={{ marginTop: 20, background: "#ffffff", padding: 20, borderRadius: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
              Loading pipelines...
            </div>
          ) : (
            <>
              <div className="table-scroll">
              <table style={{ width: "100%", minWidth: 680, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Project</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Branch</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Triggered By</th>
                    <th style={{ padding: "12px 16px", fontWeight: "600", color: "#374151", fontSize: "14px" }}>Last Activity</th>
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
                        {new Date(p.lastRunAt || p.updatedAt || p.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {pipelines.length === 0 && <p style={{ textAlign: "center", color: "#9ca3af" }}>No pipelines yet.</p>}
            </>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

