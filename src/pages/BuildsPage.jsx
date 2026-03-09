import { useEffect, useState } from "react";
import api from "../api/api";
import BuildsTable from "../components/BuildTable";
import SidebarLayout from "../components/SidebarLayout";

export default function BuildsPage() {
  const [builds, setBuilds] = useState([]);

  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const res = await api.get("/builds");
        setBuilds(res.data);
      } catch (err) {
        console.error("Failed to load builds", err);
      }
    };

    fetchBuilds();
  }, []);

  return (
    <SidebarLayout>
      <header style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Builds</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
          Detailed build history powering your dashboard metrics and AI analysis.
        </p>
      </header>
      <BuildsTable builds={builds} />
    </SidebarLayout>
  );
}

