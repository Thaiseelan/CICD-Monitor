import { useQuery } from '@tanstack/react-query';
import MetricsDisplay from "../components/MetricsDisplay";
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

  const isLoading = buildsLoading || metricsLoading;

  return (
    <SidebarLayout>
      <header style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#e5e7eb" }}>Dashboard</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
          Live CI/CD health, trends, and AI-driven insights for your projects.
        </p>
      </header>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          Loading dashboard data...
        </div>
      ) : (
        <MetricsDisplay builds={builds} metrics={metrics} />
      )}
    </SidebarLayout>
  );
}
