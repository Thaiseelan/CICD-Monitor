export default function StatusBadge({ status }) {
  const colors = {
    success: "green",
    failed: "red",
    running: "orange",
    pending: "gray"
  };

  return (
    <span style={{
      padding: "4px 10px",
      borderRadius: "12px",
      backgroundColor: colors[status] || "gray",
      color: "white",
      fontSize: "12px"
    }}>
      {status}
    </span>
  );
}
