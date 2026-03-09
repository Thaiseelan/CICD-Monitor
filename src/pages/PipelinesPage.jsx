import SidebarLayout from "../components/SidebarLayout";

export default function PipelinesPage() {
  return (
    <SidebarLayout>
      <div style={{ padding: 0 }}>
        <h2 style={{ marginBottom: "8px" }}>Pipelines</h2>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>
          This page will show per-project pipeline health, recent runs, and
          configuration details.
        </p>
      </div>
    </SidebarLayout>
  );
}

