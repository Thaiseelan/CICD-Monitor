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

const MetricsDisplay = ({ builds, metrics }) => {
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
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
        Trend: {trend}
      </p>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 30 }}>
        {/* Line Chart */}
        <div style={{ background: "#1f2937", padding: 20, borderRadius: 12, boxShadow: "0 3px 12px rgba(0,0,0,0.3)", border: "1px solid #374151" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#e5e7eb" }}>
            📈 Build Duration Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }} />
              <Line
                type="monotone"
                dataKey="duration"
                stroke="#8b5cf6"
                dot={false}
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={800}
              />
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
        <div style={{ background: "#ffffff", padding: 20, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,0.1)", border: "1px solid #e5e7eb" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#111827" }}>
            🥧 Build Status Distribution
          </h3>
          {total === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 16 }}>No build data available</p>
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
      background: "#ffffff",
      padding: "20px",
      borderRadius: "10px",
      textAlign: "center",
      boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      border: `2px solid ${borderColor}`,
    }}>
      <h4 style={{
        margin: 0,
        fontSize: "13px",
        color: "#6b7280",
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}>
        System Health
      </h4>
      <h2 style={{
        margin: "10px 0 4px 0",
        fontSize: "28px",
        fontWeight: "700",
        color: accent,
      }}>
        {grade}
      </h2>
      <p style={{
        margin: 0,
        fontSize: "12px",
        color: accent,
        fontWeight: "500",
      }}>
        Score: {(score * 100).toFixed(1)}%
      </p>
    </div>
  );
};

export default MetricsDisplay;
