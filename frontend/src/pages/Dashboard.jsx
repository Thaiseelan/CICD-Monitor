import { useEffect, useState } from "react";
import MetricsDisplay from "../components/MetricsDisplay";
import api from "../api/api";
import SidebarLayout from "../components/SidebarLayout";

export default function Dashboard() {
  const [builds, setBuilds] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildRes, metricsRes] = await Promise.all([
          api.get("/builds"),
          api.get("/metrics"),
        ]);
        setBuilds(buildRes.data);
        setMetrics(metricsRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SidebarLayout>
      <header style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#e5e7eb" }}>Dashboard</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
          Live CI/CD health, trends, and AI-driven insights for your projects.
        </p>
      </header>
      <MetricsDisplay builds={builds} metrics={metrics} />
    </SidebarLayout>
  );
}
