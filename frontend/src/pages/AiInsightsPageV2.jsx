import { useEffect, useState } from "react";
import SidebarLayout from "../components/SidebarLayout";
import api from "../api/api";
import StatusBadge from "../components/StatusBadge";

function parseInsight(text = "") {
  const sections = { summary: "", problem: "", solution: "" };
  const lines = text.split(/\r?\n/).map((line) => line.trim());
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

function formatDuration(ms) {
  if (!ms) return "-";
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)} min`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms} ms`;
}

export default function AiInsightsPageV2() {
  const [builds, setBuilds] = useState([]);
  const [overview, setOverview] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [insightRaw, setInsightRaw] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [source, setSource] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [errorInsight, setErrorInsight] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildsRes, overviewRes] = await Promise.all([
          api.get("/builds"),
          api.get("/ai-overview"),
        ]);
        setBuilds(buildsRes.data);
        setOverview(overviewRes.data);
        if (buildsRes.data.length > 0) {
          setSelectedId(buildsRes.data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load insights data", err);
      }
    };
    fetchData();
  }, []);

  const generateInsight = async () => {
    if (!selectedId) return;

    setLoadingInsight(true);
    setErrorInsight("");
    setInsightRaw("");
    setAnalysis(null);
    setSource("");

    try {
      const res = await api.get(`/ai-insights/${selectedId}`);
      setInsightRaw(res.data?.insight || "");
      setAnalysis(res.data?.analysis || null);
      setSource(res.data?.source || "");
    } catch (err) {
      console.error("AI insight failed", err);
      setErrorInsight(err.response?.data?.error || "Could not generate AI insight.");
    } finally {
      setLoadingInsight(false);
    }
  };

  const selectedBuild = builds.find((build) => build._id === selectedId) || null;
  const structured = parseInsight(insightRaw);

  return (
    <SidebarLayout>
      <header style={{ marginBottom: 18 }}>
        <div className="page-hero">
          <div>
            <div className="eyebrow">AI + Heuristics</div>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "2rem", color: "#f8fafc" }}>Intelligence Workbench</h2>
            <p style={{ margin: "8px 0 0 0", fontSize: 14, color: "#cbd5e1", maxWidth: 760 }}>
              Build-specific root-cause insights, repeat failure context, and portfolio-level recommendations.
            </p>
          </div>
          <div className="hero-chip">
            <span className="hero-chip__label">Portfolio Risk</span>
            <strong>{overview?.risk?.level || "loading"}</strong>
          </div>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="glass-panel">
          <div className="eyebrow">Headline</div>
          <div style={{ marginTop: 10, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>
            {overview?.headline || "Loading intelligence"}
          </div>
        </div>
        <div className="glass-panel">
          <div className="eyebrow">Recent Failure Rate</div>
          <div style={{ marginTop: 10, color: "#f8fafc", fontSize: 32, fontWeight: 800 }}>
            {overview?.risk?.recentFailureRate ?? 0}%
          </div>
        </div>
        <div className="glass-panel">
          <div className="eyebrow">Most At-Risk Repo</div>
          <div style={{ marginTop: 10, color: "#f8fafc", fontSize: 22, fontWeight: 700 }}>
            {overview?.repoRisks?.[0]?.repositoryName || "-"}
          </div>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          <div style={{ paddingBottom: 12, borderBottom: "1px solid rgba(148,163,184,0.12)" }}>
            <div className="eyebrow">Recent Builds</div>
            <p style={{ margin: "8px 0 0 0", fontSize: 13, color: "#94a3b8" }}>
              Choose a build to generate a focused diagnosis.
            </p>
          </div>
          <div style={{ maxHeight: 560, overflowY: "auto", marginTop: 10, display: "grid" }}>
            {builds.length === 0 && (
              <p style={{ padding: 16, margin: 0, fontSize: 13, color: "#64748b" }}>
                No builds yet. Trigger a pipeline run to see intelligence.
              </p>
            )}
            {builds.map((build) => {
              const isActive = build._id === selectedId;
              return (
                <button
                  key={build._id}
                  type="button"
                  onClick={() => {
                    setSelectedId(build._id);
                    setInsightRaw("");
                    setAnalysis(null);
                    setSource("");
                    setErrorInsight("");
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "14px 0",
                    background: isActive ? "rgba(14,165,233,0.09)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(148,163,184,0.1)",
                    cursor: "pointer",
                    color: "#e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "0 4px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#f8fafc" }}>{build.repositoryName}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        {build.branch} • {formatDuration(build.duration)} • {build.author || "unknown"}
                      </div>
                    </div>
                    <StatusBadge status={build.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
            <div>
              <div className="eyebrow">Selected Build</div>
              <h3 style={{ margin: "6px 0 4px 0", color: "#f8fafc" }}>
                {selectedBuild ? `${selectedBuild.repositoryName} / ${selectedBuild.branch}` : "No build selected"}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                {selectedBuild ? `${selectedBuild.commitId?.slice(0, 7)} • ${formatDuration(selectedBuild.duration)}` : "Choose a build from the list"}
              </p>
            </div>
            {selectedBuild && (
              <button className="primary-action" type="button" onClick={generateInsight} disabled={loadingInsight}>
                {loadingInsight ? "Analyzing..." : "Generate Insight"}
              </button>
            )}
          </div>

          {errorInsight && <p style={{ fontSize: 13, color: "#fca5a5", marginTop: 16 }}>{errorInsight}</p>}
          {!loadingInsight && !errorInsight && !insightRaw && (
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 16 }}>
              Select a build and run the analyzer to see structured diagnosis and actions.
            </p>
          )}

          {insightRaw && (
            <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="hero-chip" style={{ padding: "6px 10px" }}>
                  <span className="hero-chip__label">Source</span>
                  <strong>{source || "heuristic"}</strong>
                </span>
                {analysis?.dominantIssue && (
                  <span className="hero-chip" style={{ padding: "6px 10px" }}>
                    <span className="hero-chip__label">Likely Area</span>
                    <strong>{analysis.dominantIssue}</strong>
                  </span>
                )}
              </div>

              <InsightBlock title="Summary" color="#38bdf8" text={structured.summary || analysis?.summary} />
              <InsightBlock title="Problem" color="#fb7185" text={structured.problem || analysis?.problem} />
              <InsightBlock title="Solution" color="#34d399" text={structured.solution || analysis?.solution} />

              {analysis && (
                <div className="glass-subpanel">
                  <div className="eyebrow">Historical Context</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 10 }}>
                    <MiniStat label="Previous Branch Failures" value={analysis.previousFailures ?? 0} />
                    <MiniStat label="Branch Baseline Duration" value={formatDuration(analysis.baselineDurationMs)} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

function InsightBlock({ title, color, text }) {
  return (
    <div className="glass-subpanel" style={{ borderColor: `${color}40` }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color }}>{title}</div>
      <p style={{ margin: "8px 0 0 0", color: "#e2e8f0", fontSize: 14, lineHeight: 1.6 }}>
        {text || "-"}
      </p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ borderTop: "1px solid rgba(148,163,184,0.12)", paddingTop: 10 }}>
      <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</div>
      <div style={{ marginTop: 6, color: "#f8fafc", fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
