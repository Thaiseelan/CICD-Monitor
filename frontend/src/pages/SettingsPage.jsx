import { useEffect, useState } from "react";
import SidebarLayout from "../components/SidebarLayout";
import api from "../api/api";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    emailOnSuccess: true,
    emailOnFailure: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/auth/settings");
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put("/auth/settings", { notifications });
      alert("Settings saved!");
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <header style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Settings</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
          Configure your notification preferences.
        </p>
      </header>
      <div>
        <h3>Notifications</h3>
        <label>
          <input
            type="checkbox"
            checked={notifications.emailOnSuccess}
            onChange={(e) => setNotifications({ ...notifications, emailOnSuccess: e.target.checked })}
          />
          Email on successful builds
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={notifications.emailOnFailure}
            onChange={(e) => setNotifications({ ...notifications, emailOnFailure: e.target.checked })}
          />
          Email on failed builds
        </label>
        <br />
        <button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </SidebarLayout>
  );
}