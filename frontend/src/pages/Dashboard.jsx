import { useQuery } from '@tanstack/react-query';
import MetricsDisplay from "../components/MetricsDisplayV2";
import api from "../api/api";
import SidebarLayout from "../components/SidebarLayout";

export default function Dashboard() {
  const { data: builds = [], isLoading: buildsLoading } = useQuery({
    queryKey: ['builds'],
    queryFn: async () => {
      const res = await api.get("/builds");
      return res.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: metrics = null, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const res = await api.get("/metrics");
      return res.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const { data: overview = null, isLoading: overviewLoading } = useQuery({
    queryKey: ['ai-overview'],
    queryFn: async () => {
      const res = await api.get("/ai-overview");
      return res.data;
    },
    refetchInterval: 10000,
  });

  const isLoading = buildsLoading || metricsLoading || overviewLoading;

  return (
    <SidebarLayout>
      <header style={{ marginBottom: 18 }}>
        <div className="page-hero">
          <div>
            <div className="eyebrow">Control Room</div>
            <h2 style={{ margin: "8px 0 0 0", color: "#f8fafc", fontSize: "2rem" }}>Intelligent CI/CD Monitor</h2>
            <p style={{ margin: "8px 0 0 0", fontSize: 14, color: "#cbd5e1", maxWidth: 760 }}>
              Live pipeline health, branch risk, anomaly detection, and focused recommendations across your delivery flow.
            </p>
          </div>
          <div className="hero-chip">
            <span className="hero-chip__label">Risk</span>
            <strong>{overview?.risk?.level || "loading"}</strong>
          </div>
        </div>
      </header>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          Loading dashboard data...
        </div>
      ) : (
        <MetricsDisplay builds={builds} metrics={metrics} overview={overview} />
      )}
    </SidebarLayout>
  );
}
