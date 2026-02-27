import { useEffect, useState } from "react";
import axios from "axios";
import BuildsTable from "../components/BuildTable";

export default function Dashboard() {
  const [builds, setBuilds] = useState([]);

  const fetchBuilds = async () => {
    const res = await axios.get("http://localhost:5000/api/builds");
    setBuilds(res.data);
  };

  useEffect(() => {
    fetchBuilds();
    const interval = setInterval(fetchBuilds, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>CI Dashboard</h2>
      <BuildsTable builds={builds} />
    </div>
  );
}
