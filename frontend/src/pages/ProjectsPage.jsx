import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from "react";
import api from "../api/api";
import SidebarLayout from "../components/SidebarLayout";

function getWebhookUrl(token, baseUrl) {
  const base = (baseUrl || "http://localhost:5000").replace(/\/$/, "");
  return `${base}/api/webhook/${token}`;
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get("/projects");
      return res.data;
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      const res = await api.post("/projects", projectData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId) => {
      await api.delete(`/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, data }) => {
      const res = await api.patch(`/projects/${projectId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const sortedProjects = [...projects].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const [name, setName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [webhookBaseUrl, setWebhookBaseUrl] = useState("http://localhost:5000");
  const [error, setError] = useState("");
  const [editingBaseUrl, setEditingBaseUrl] = useState(null);
  const [baseUrlValue, setBaseUrlValue] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createProjectMutation.mutateAsync({
        name,
        repoUrl,
        webhookBaseUrl: webhookBaseUrl || "http://localhost:5000"
      });
      setName("");
      setRepoUrl("");
      setWebhookBaseUrl("http://localhost:5000");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create project."
      );
    }
  };

  const handleTriggerBuild = async (projectId) => {
    try {
      await api.post("/builds", { projectId, branch: "main", message: "Manual trigger" });
      alert("Build triggered!");
    } catch (err) {
      console.error("Trigger build failed", err);
      setError("Failed to trigger build.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProjectMutation.mutateAsync(id);
    } catch (err) {
      console.error("Delete project failed", err);
      setError("Failed to delete project.");
    }
  };

  const startEditBaseUrl = (p) => {
    setEditingBaseUrl(p._id);
    setBaseUrlValue(p.webhookBaseUrl || "http://localhost:5000");
  };
  const saveBaseUrl = async (projectId) => {
    try {
      await updateProjectMutation.mutateAsync({
        projectId,
        data: { webhookBaseUrl: baseUrlValue || "http://localhost:5000" }
      });
      setEditingBaseUrl(null);
    } catch (err) {
      console.error("Update base URL failed", err);
    }
  };
  const copyWebhookUrl = (url) => {
    navigator.clipboard.writeText(url);
  };

  return (
    <SidebarLayout>
      <div style={{ padding: 0 }}>
        <h2 style={{ marginBottom: 8 }}>Projects</h2>
        <p style={{ marginTop: 0, color: "#6b7280", fontSize: 14 }}>
          Create a project to get a unique webhook URL. Builds and AI insights
          are now scoped per account.
        </p>

        {error && (
          <div
            style={{
              marginTop: 12,
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(248, 113, 113, 0.5)",
              background: "rgba(248, 113, 113, 0.08)",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        <div
          className="projects-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 16,
            maxWidth: 980,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>New project</h3>
            <form
              onSubmit={handleCreate}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div className="projects-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Project name (e.g. api-service)"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  required
                  placeholder="Repo URL (e.g. https://github.com/org/repo)"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: "none",
                    background: "linear-gradient(to right, #a855f7, #6366f1, #0ea5e9)",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: createProjectMutation.isPending ? "not-allowed" : "pointer",
                    opacity: createProjectMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>
                  Webhook base URL (paste your ngrok URL here, e.g. https://xxx.ngrok-free.dev)
                </label>
                <input
                  value={webhookBaseUrl}
                  onChange={(e) => setWebhookBaseUrl(e.target.value)}
                  placeholder="https://xxx.ngrok-free.dev or http://localhost:5000"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
            </form>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Your projects</h3>

            {sortedProjects.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: 14, marginTop: 0 }}>
                No projects yet. Create one above to generate a webhook URL.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {sortedProjects.map((p) => (
                  <div
                    key={p._id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 14,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <div
                      className="project-card-header"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                        <div style={{ color: "#6b7280", fontSize: 13 }}>
                          {p.repoUrl}
                        </div>
                      </div>
                      <div className="project-card-actions" style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleTriggerBuild(p._id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "none",
                            background: "#22c55e",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Trigger Build
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p._id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid rgba(239, 68, 68, 0.35)",
                            background: "rgba(239, 68, 68, 0.08)",
                            color: "#b91c1c",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {editingBaseUrl === p._id ? (
                      <div className="project-inline-edit" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          value={baseUrlValue}
                          onChange={(e) => setBaseUrlValue(e.target.value)}
                          placeholder="https://xxx.ngrok-free.dev"
                          style={{
                            flex: 1,
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            fontSize: 13,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => saveBaseUrl(p._id)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "#22c55e",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBaseUrl(null)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
                        Base URL: {p.webhookBaseUrl || "http://localhost:5000"}{" "}
                        <button
                          type="button"
                          onClick={() => startEditBaseUrl(p)}
                          style={{
                            marginLeft: 8,
                            padding: "2px 6px",
                            fontSize: 11,
                            border: "1px solid #e5e7eb",
                            borderRadius: 4,
                            cursor: "pointer",
                            background: "#f9fafb",
                          }}
                        >
                          Change (e.g. ngrok)
                        </button>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#0b1220",
                        color: "#e5e7eb",
                        borderRadius: 10,
                        padding: "10px 12px",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        fontSize: 13,
                        overflowX: "auto",
                      }}
                      title="Use this URL in GitHub Webhooks"
                    >
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.webhookToken
                          ? getWebhookUrl(p.webhookToken, p.webhookBaseUrl)
                          : "No webhook token."}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyWebhookUrl(getWebhookUrl(p.webhookToken, p.webhookBaseUrl))}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(148, 163, 184, 0.5)",
                          background: "rgba(30, 41, 59, 0.8)",
                          color: "#e5e7eb",
                          cursor: "pointer",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

