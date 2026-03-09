import StatusBadge from "../components/StatusBadge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const thStyle = {
  padding: "12px 16px",
  fontWeight: "600",
  color: "#374151",
  fontSize: "14px",
};


const BuildsTable = ({ builds, metrics }) => {
  const total   = metrics?.summary?.total   ?? builds.length;
  const success = metrics?.summary?.success ?? builds.filter(b => b.status === "success").length;
  const running = metrics?.summary?.running ?? builds.filter(b => b.status === "running").length;
  const failed  = metrics?.summary?.failed  ?? builds.filter(b => b.status === "failed").length;

  const sortedBuilds = [...builds].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  const chartData = sortedBuilds.map((b) => ({
    name: new Date(b.createdAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata',
    }),
    duration: b.duration || 0,
  }));
  let trend = "Not enough data";
  if (metrics?.trends) {
    const { durationTrend, durationChangePct } = metrics.trends;
    if (durationTrend === "increasing") {
      trend = `Duration up ${(durationChangePct * 100).toFixed(1)}% ↑`;
    } else if (durationTrend === "decreasing") {
      trend = `Duration down ${(Math.abs(durationChangePct) * 100).toFixed(1)}% ↓`;
    } else if (durationTrend === "flat") {
      trend = "Duration stable (±10%)";
    }
  } else if (chartData.length > 1) {
    trend =
      chartData[chartData.length - 1].duration < chartData[0].duration
        ? "Improving 📉"
        : "Degrading 📈";
  }

const COLORS = ["#10b981", "#ef4444", "#3b82f6"];
  const pieData = [
    { name: "Success", value: success },
    { name: "Failed",  value: failed  },
    { name: "Running", value: running },
  ];
  const avgDuration =
    metrics?.metrics?.avgDurationMs ??
    (total > 0
      ? builds.reduce((sum, b) => sum + (b.duration || 0), 0) / total
      : 0);

  return (
    <div>
      {/* Summary + Health Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "10px", flexWrap: "wrap" }}>
        <StatCard title="Total Builds" value={total} />
        <StatCard title="Success"      value={success} color="#10b981" />
        <StatCard title="Running"      value={running} color="#3b82f6" />
        <StatCard title="Failed"       value={failed}  color="#ef4444" />
        <HealthCard health={metrics?.health} />
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Trend: {trend}
      </p>

      {/* 3. Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Line Chart */}
        <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-800">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            📈 Build Duration Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              {/* Actual duration data line */}
              <Line
                type="monotone"
                dataKey="duration"
                stroke="#8b5cf6"
                dot={false}
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={800}
              />
              {/* Average duration line */}
              <Line
                type="monotone"
                dataKey={() => avgDuration}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                dot={false}
                strokeWidth={3}
                isAnimationActive={true}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            🥧 Build Status Distribution
          </h3>
          {total === 0 ? (
            <p className="text-gray-400 text-sm mt-4">No build data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  outerRadius={100}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Builds Table */}
      <div style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb" }}>
              <th style={thStyle}>Repository</th>
              <th style={thStyle}>Branch</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Duration (ms)</th>
            </tr>
          </thead>
          <tbody>
            {builds.map((b) => (
              <tr
                key={b._id}
                style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "14px 16px", fontWeight: "500", color: "#111827" }}>
                  {b.repositoryName}
                </td>
                <td style={{ padding: "14px 16px", color: "#6b7280" }}>{b.branch}</td>
                <td style={{ padding: "14px 16px" }}>
                  <StatusBadge status={b.status} />
                </td>
                <td style={{ padding: "14px 16px", color: "#6b7280" }}>
                  {b.duration || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div style={{
    flex: 1,
    background: "#ffffff",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb",
  }}>
    <h4 style={{
      margin: 0,
      fontSize: "13px",
      color: "#6b7280",
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }}>
      {title}
    </h4>
    <h2 style={{
      margin: "10px 0 0 0",
      fontSize: "32px",
      fontWeight: "700",
      color: color || "#111827",
    }}>
      {value}
    </h2>
  </div>
);

const HealthCard = ({ health }) => {
  const score = health?.score ?? 0;
  const grade = health?.grade ?? "-";
  const status = health?.status ?? "unknown";

  let borderColor = "#e5e7eb";
  let accent = "#6b7280";
  if (status === "healthy") {
    borderColor = "rgba(34,197,94,0.5)";
    accent = "#16a34a";
  } else if (status === "warning") {
    borderColor = "rgba(245,158,11,0.6)";
    accent = "#d97706";
  } else if (status === "critical") {
    borderColor = "rgba(239,68,68,0.7)";
    accent = "#dc2626";
  }

  return (
    <div style={{
      flex: 1,
      minWidth: 220,
      background: "#020617",
      padding: "18px 18px",
      borderRadius: "10px",
      boxShadow: "0 3px 10px rgba(15,23,42,0.7)",
      border: `1px solid ${borderColor}`,
      display: "flex",
      alignItems: "center",
      gap: 14,
      color: "#e5e7eb",
    }}>
      <div style={{
        width: 54,
        height: 54,
        borderRadius: "999px",
        border: `3px solid ${accent}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 18,
      }}>
        {score}
      </div>
      <div>
        <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "#9ca3af" }}>
          Pipeline Health
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{grade}</span>
          <span style={{ fontSize: 12, color: accent, textTransform: "capitalize" }}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BuildsTable;