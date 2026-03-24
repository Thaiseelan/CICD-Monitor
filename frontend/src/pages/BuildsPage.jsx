import { useQuery } from '@tanstack/react-query';
import api from "../api/api";
import BuildsListTable from "../components/BuildsListTable";
import SidebarLayout from "../components/SidebarLayout";

export default function BuildsPage() {
  const { data: builds = [], isLoading } = useQuery({
    queryKey: ['builds'],
    queryFn: async () => {
      const res = await api.get("/builds");
      return res.data;
    },
  });

  return (
    <SidebarLayout>
      <header style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Builds</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
          Detailed build history powering your dashboard metrics and AI analysis.
        </p>
      </header>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          Loading builds...
        </div>
      ) : (
        <BuildsListTable builds={builds} />
      )}
    </SidebarLayout>
  );
}

