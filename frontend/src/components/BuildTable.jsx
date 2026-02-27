import { useState, useEffect } from "react";
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


const BuildsTable = ({ builds }) => {
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError]     = useState(false);

  const total   = builds.length;
  const success = builds.filter(b => b.status === "success").length;
  const running = builds.filter(b => b.status === "running").length;
  const failed  = builds.filter(b => b.status === "failed").length;

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
const trend =
  chartData.length > 1 &&
  chartData[chartData.length - 1].duration <
  chartData[0].duration
    ? "Improving 📉"
    : "Degrading 📈";

const COLORS = ["#10b981", "#ef4444", "#3b82f6"];
  const pieData = [
    { name: "Success", value: success },
    { name: "Failed",  value: failed  },
    { name: "Running", value: running },
  ];
  const avgDuration = total > 0 ? builds.reduce((sum, b) => sum + (b.duration || 0), 0) / total: 0;

  useEffect(() => {
    setAiLoading(true);
    setAiError(false);

    fetch("http://localhost:5000/api/ai-insights")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setAiInsight(data.insight || "No insights available.");
        setAiLoading(false);
      })
      .catch(err => {
        console.error("AI fetch failed", err);
        setAiError(true);
        setAiLoading(false);
      });
  }, []);

  return (
    <div>
      {/* 1. AI Insights Panel */}
      <div className="bg-purple-100 p-6 rounded-xl mb-6">
        <h3 className="font-semibold text-purple-700 mb-2">🧠 AI Insights</h3>
        {aiLoading && <p>Analyzing builds...</p>}
        {aiError   && <p className="text-red-500">Failed to load AI insights.</p>}
        {!aiLoading && !aiError && (
          <p className="text-gray-700 whitespace-pre-line">{aiInsight}</p>
        )}
      </div>

      {/* 2. Summary Cards */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <StatCard title="Total Builds" value={total} />
        <StatCard title="Success"      value={success} color="#10b981" />
        <StatCard title="Running"      value={running} color="#3b82f6" />
        <StatCard title="Failed"       value={failed}  color="#ef4444" />
      </div>
<p className="text-sm text-gray-400 mb-2">
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

export default BuildsTable;