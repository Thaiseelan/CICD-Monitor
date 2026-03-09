import { useEffect, useState } from "react";
import SidebarLayout from "../components/SidebarLayout";
import api from "../api/api";
import StatusBadge from "../components/StatusBadge";

function parseInsight(text = "") {
  const sections = {
    summary: "",
    problem: "",
    solution: "",
  };

  const lines = text.split(/\r?\n/).map((l) => l.trim());
  let current = null;

  for (const line of lines) {
    if (/^summary:/i.test(line)) {
      current = "summary";
      sections.summary = line.replace(/^summary:\s*/i, "");
      continue;
    }
    if (/^problem:/i.test(line)) {
      current = "problem";
      sections.problem = line.replace(/^problem:\s*/i, "");
      continue;
    }
    if (/^solution:/i.test(line)) {
      current = "solution";
      sections.solution = line.replace(/^solution:\s*/i, "");
      continue;
    }
    if (current && line) {
      sections[current] = `${sections[current]} ${line}`.trim();
    }
  }

  return sections;
}

export default function AiInsightsPage() {
  const [builds, setBuilds] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [insightRaw, setInsightRaw] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [errorInsight, setErrorInsight] = useState("");

  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const res = await api.get("/builds");
        setBuilds(res.data);
        if (res.data.length > 0) {
          setSelectedId(res.data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load builds for AI insights", err);
      }
    };
    fetchBuilds();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingInsight(true);
    setErrorInsight("");
    setInsightRaw("");

    api
      .get(`/ai-insights/${selectedId}`)
      .then((res) => {
        setInsightRaw(res.data?.insight || "");
      })
      .catch((err) => {
        console.error("AI per-build insight failed", err);
        setErrorInsight(
          err.response?.data?.error || "Could not generate AI insight."
        );
      })
      .finally(() => setLoadingInsight(false));
  }, [selectedId]);

  const selectedBuild = builds.find((b) => b._id === selectedId) || null;
  const structured = parseInsight(insightRaw);

  return (
    <SidebarLayout>
      <header style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>AI Insights</h2>
        <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#9ca3af" }}>
          Click a build to see a short, structured explanation of what went
          wrong and how to fix it.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        {/* Builds list */}
        <div
          style={{
            background: "#020617",
            borderRadius: 12,
            border: "1px solid rgba(31,41,55,0.9)",
            boxShadow: "0 3px 12px rgba(15,23,42,0.8)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid rgba(31,41,55,0.9)",
              fontSize: 13,
              color: "#9ca3af",
            }}
          >
            Recent builds
          </div>
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {builds.length === 0 && (
              <p
                style={{
                  padding: 16,
                  margin: 0,
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                No builds yet. Trigger a pipeline run to see AI insights.
              </p>
            )}
            {builds.map((b) => {
              const isActive = b._id === selectedId;
              return (
                <button
                  key={b._id}
                  type="button"
                  onClick={() => setSelectedId(b._id)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    textAlign: "left",
                    backgroundColor: isActive
                      ? "rgba(37,99,235,0.18)"
                      : "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(31,41,55,0.8)",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.4fr) 0.9fr auto",
                    gap: 8,
                    alignItems: "center",
                    color: "#e5e7eb",
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{b.repositoryName}</span>
                    <span style={{ color: "#6b7280" }}> · {b.branch}</span>
                  </div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>
                    Duration: {b.duration ? `${b.duration} ms` : "-"}
                  </div>
                  <StatusBadge status={b.status} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Insight panel */}
        <div
          style={{
            background: "#020617",
            borderRadius: 12,
            border: "1px solid rgba(31,41,55,0.9)",
            boxShadow: "0 3px 12px rgba(15,23,42,0.8)",
            padding: 16,
            minHeight: 220,
          }}
        >
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: 15,
              color: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🧠</span>
            <span>AI insight</span>
          </h3>
          {selectedBuild && (
            <p style={{ margin: "0 0 10px 0", fontSize: 12, color: "#9ca3af" }}>
              {selectedBuild.repositoryName} · {selectedBuild.branch}
            </p>
          )}

          {loadingInsight && (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              Analyzing build… this usually takes a second.
            </p>
          )}
          {errorInsight && (
            <p style={{ fontSize: 13, color: "#fca5a5" }}>{errorInsight}</p>
          )}
          {!loadingInsight && !errorInsight && insightRaw && (
            <div style={{ fontSize: 13, color: "#e5e7eb", display: "grid", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", color: "#9ca3af" }}>
                  Summary
                </div>
                <p style={{ margin: 2 }}>{structured.summary || "-"}</p>
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", color: "#f97316" }}>
                  Problem
                </div>
                <p style={{ margin: 2 }}>{structured.problem || "-"}</p>
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", color: "#22c55e" }}>
                  Solution
                </div>
                <p style={{ margin: 2 }}>{structured.solution || "-"}</p>
              </div>
            </div>
          )}
          {!loadingInsight && !errorInsight && !insightRaw && (
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Select a build on the left to generate a focused AI explanation.
            </p>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

