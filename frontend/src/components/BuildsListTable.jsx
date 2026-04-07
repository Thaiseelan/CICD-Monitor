import StatusBadge from "../components/StatusBadge";
import { Link } from "react-router-dom";

const thStyle = {
  padding: "12px 16px",
  fontWeight: "600",
  color: "#374151",
  fontSize: "14px",
};

const BuildsListTable = ({ builds }) => {
  return (
    <div className="table-card" style={{
      background: "#ffffff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      border: "1px solid #e5e7eb",
    }}>
      <div className="table-scroll">
      <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
            <th style={thStyle}>Repository</th>
            <th style={thStyle}>Branch</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Duration (ms)</th>
            <th style={thStyle}>Created</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((b) => (
            <tr
              key={b._id}
              style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.2s", cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <td style={{ padding: "14px 16px", fontWeight: "500", color: "#111827" }}>
                <Link to={`/builds/${b._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  {b.repositoryName}
                </Link>
              </td>
              <td style={{ padding: "14px 16px", color: "#6b7280" }}>{b.branch}</td>
              <td style={{ padding: "14px 16px" }}>
                <StatusBadge status={b.status} />
              </td>
              <td style={{ padding: "14px 16px", color: "#6b7280" }}>
                {b.duration || "-"}
              </td>
              <td style={{ padding: "14px 16px", color: "#6b7280" }}>
                {new Date(b.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {builds.length === 0 && (
        <p style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>
          No builds yet. Trigger a pipeline run to see builds here.
        </p>
      )}
    </div>
  );
};

export default BuildsListTable;
