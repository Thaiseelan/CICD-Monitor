import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatDuration(ms) {
  if (!ms) return "-";
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)} min`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms} ms`;
}

function getRiskTone(level) {
  if (level === "high") return { accent: "#f97316", glow: "rgba(249,115,22,0.25)" };
  if (level === "medium") return { accent: "#facc15", glow: "rgba(250,204,21,0.2)" };
  return { accent: "#34d399", glow: "rgba(52,211,153,0.22)" };
}

const Panel = ({ title, subtitle, children, className = "" }) => (
  <div className={`glass-panel delay-1 fade-in ${className}`}>
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ margin: 0, fontSize: 18, color: "#f8fafc", fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#94a3b8" }}>{subtitle}</p>
    </div>
    {children}
  </div>
);

const MetricCard = ({ title, value, detail }) => (
  <div className="glass-subpanel hover-effect">
    <div className="eyebrow">{title}</div>
    <div style={{ marginTop: 12, fontSize: 32, fontWeight: 700, color: "#f8fafc", fontFamily: "'Outfit', sans-serif" }}>{value}</div>
    <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{detail}</div>
  </div>
);

const StatCard = ({ title, value, color, subtitle, delayClass }) => (
  <div className={`glass-panel ${delayClass} fade-in`} style={{ padding: 24, borderTop: `4px solid ${color}` }}>
    <div className="eyebrow">{title}</div>
    <div style={{ marginTop: 16, fontSize: 38, fontWeight: 800, color, fontFamily: "'Outfit', sans-serif", textShadow: `0 0 20px ${color}40` }}>{value}</div>
    <div style={{ marginTop: 8, fontSize: 13, color: "#94a3b8" }}>{subtitle}</div>
  </div>
);

const HealthCard = ({ health, delayClass }) => {
  const score = health?.score ?? 0;
  const grade = health?.grade ?? "-";
  const status = health?.status ?? "unknown";
  const accent =
    status === "healthy" ? "#34d399" : status === "warning" ? "#facc15" : "#fb7185";

  return (
    <div className={`glass-panel ${delayClass} fade-in`} style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: `linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, ${accent}15 100%)` }}>
      <div className="eyebrow" style={{ alignSelf: "flex-start" }}>System Health</div>
      <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontSize: 48, fontWeight: 800, color: accent, fontFamily: "'Outfit', sans-serif", textShadow: `0 0 25px ${accent}60` }}>{grade}</span>
        <span style={{ color: "#f8fafc", fontSize: 16, textTransform: "capitalize", fontWeight: 600, padding: "4px 12px", background: `${accent}30`, borderRadius: "99px", border: `1px solid ${accent}50` }}>{status}</span>
      </div>
      <div style={{ marginTop: 12, color: "#cbd5e1", fontSize: 14, fontWeight: 500, alignSelf: "flex-start" }}>Health Score: <span style={{color: "#fff"}}>{score}</span>/100</div>
    </div>
  );
};

export default function MetricsDisplayV2({ builds, metrics, overview }) {
  const total = metrics?.summary?.total ?? builds.length;
  const success = metrics?.summary?.success ?? builds.filter((b) => b.status === "success").length;
  const running = metrics?.summary?.running ?? builds.filter((b) => b.status === "running").length;
  const failed = metrics?.summary?.failed ?? builds.filter((b) => b.status === "failed").length;

  const sortedBuilds = [...builds].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const avgDuration = metrics?.metrics?.avgDurationMs ?? 0;
  const p95Duration = metrics?.metrics?.p95DurationMs ?? 0;
  const chartData = sortedBuilds.map((build) => ({
    name: new Date(build.createdAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    }),
    duration: build.duration || 0,
    baseline: avgDuration,
  }));

  const riskTone = getRiskTone(overview?.risk?.level);
  const trendText =
    metrics?.trends?.durationTrend === "increasing"
      ? `Build duration rose by ${(metrics.trends.durationChangePct * 100).toFixed(1)}%`
      : metrics?.trends?.durationTrend === "decreasing"
        ? `Build duration improved by ${(Math.abs(metrics.trends.durationChangePct) * 100).toFixed(1)}%`
        : metrics?.trends?.durationTrend === "flat"
          ? "Build duration is stable"
          : "Collecting baseline trend data";

  const pieData = [
    { name: "Success", value: success, color: "#34d399" },
    { name: "Failed", value: failed, color: "#fb7185" },
    { name: "Running", value: running, color: "#38bdf8" },
  ].filter((item) => item.value > 0);

  return (
    <div style={{ display: "grid", gap: 28 }}>
      <section
        className="fade-in"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: 32,
          borderRadius: 24,
          border: "1px solid rgba(139, 92, 246, 0.2)",
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(20px)"
        }}
      >
        <div style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)", filter: "blur(40px)", borderRadius: "50%", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: -50, left: 100, width: 250, height: 250, background: "radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)", filter: "blur(40px)", borderRadius: "50%", zIndex: 0 }} />
        
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.6fr) minmax(320px, 0.9fr)",
            gap: 24,
            alignItems: "stretch",
            position: "relative",
            zIndex: 1
          }}
        >
          <div style={{ display: "grid", gap: 24 }}>
            <div>
              <div className="eyebrow" style={{ color: "#a78bfa" }}>Intelligence Summary</div>
              <h3 style={{ margin: "10px 0", fontSize: 32, color: "#f8fafc", fontFamily: "'Outfit', sans-serif", fontWeight: 700, lineHeight: 1.2 }}>
                {overview?.headline || "Pipeline intelligence is initializing."}
              </h3>
              <p style={{ margin: 0, fontSize: 16, color: "#cbd5e1", maxWidth: 760, lineHeight: 1.6 }}>
                {trendText}. Recent failures: <strong style={{ color: "#f8fafc" }}>{overview?.risk?.recentFailureRate ?? 0}%</strong> across active builds.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                gap: 14,
              }}
            >
              <MetricCard title="Build Volume" value={String(total)} detail={`${metrics?.metrics?.buildsLast24h ?? 0} in last 24h`} />
              <MetricCard title="Average Duration" value={formatDuration(avgDuration)} detail={`P95 ${formatDuration(p95Duration)}`} />
              <MetricCard title="Failure Rate" value={`${((metrics?.metrics?.failureRate ?? 0) * 100).toFixed(1)}%`} detail={`${failed} failed / ${success + failed} completed`} />
              <MetricCard title="Top Risk Branch" value={overview?.branchRisks?.[0]?.branch || "-"} detail={overview?.branchRisks?.[0] ? `${overview.branchRisks[0].repositoryName} risk ${overview.branchRisks[0].riskScore}` : "No branch outlier"} />
            </div>
          </div>

          <div
            style={{
              borderRadius: 22,
              padding: 22,
              background: `linear-gradient(180deg, ${riskTone.glow}, rgba(15,23,42,0.88))`,
              border: `1px solid ${riskTone.glow}`,
              display: "grid",
              gap: 14,
              alignContent: "start",
            }}
          >
            <div className="eyebrow">Risk Radar</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, color: riskTone.accent }}>
                {overview?.risk?.score ?? 0}
              </div>
              <div style={{ color: "#e2e8f0" }}>
                <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", opacity: 0.7 }}>
                  Current Level
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, textTransform: "capitalize" }}>
                  {overview?.risk?.level || "low"}
                </div>
              </div>
            </div>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13 }}>
              Baseline duration {formatDuration(overview?.risk?.baselineDurationMs)}.
              Recent average {formatDuration(overview?.risk?.recentAverageDurationMs)}.
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              {(overview?.recommendations || []).slice(0, 3).map((item) => (
                <div key={item} className="glass-subpanel" style={{ fontSize: 13, color: "#e2e8f0" }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
        }}
      >
        <StatCard delayClass="delay-1" title="Successful Builds" value={success} color="#34d399" subtitle="Healthy execution volume" />
        <StatCard delayClass="delay-2" title="Running Now" value={running} color="#38bdf8" subtitle="Active pipeline activity" />
        <StatCard delayClass="delay-3" title="Failed Builds" value={failed} color="#fb7185" subtitle="Immediate incidents to triage" />
        <HealthCard delayClass="delay-4" health={metrics?.health} />
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 1fr)",
          gap: 20,
          alignItems: "stretch",
        }}
      >
        <Panel title="Duration Pulse" subtitle="Recent build duration vs rolling baseline">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="durationFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: "#020617",
                  border: "1px solid rgba(148,163,184,0.18)",
                  borderRadius: 14,
                }}
              />
              <Area type="monotone" dataKey="duration" stroke="#38bdf8" strokeWidth={3} fill="url(#durationFill)" />
              <Area type="monotone" dataKey="baseline" stroke="#f97316" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Execution Mix" subtitle="Live status distribution">
          {pieData.length === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: 14 }}>No build data available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={72} outerRadius={106} paddingAngle={6}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 20,
        }}
      >
        <Panel title="Active Anomalies" subtitle="Signals that need attention">
          <div style={{ display: "grid", gap: 12 }}>
            {(overview?.anomalies?.length ? overview.anomalies : [{ message: "No major anomalies detected.", severity: "low", buildId: "empty" }]).map((item) => (
              <div
                key={`${item.buildId}-${item.message}`}
                className="glass-subpanel"
                style={{
                  borderColor:
                    item.severity === "high"
                      ? "rgba(251,113,133,0.32)"
                      : item.severity === "medium"
                        ? "rgba(250,204,21,0.24)"
                        : "rgba(52,211,153,0.22)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                  <strong style={{ color: "#f8fafc", fontSize: 13 }}>
                    {item.repositoryName ? `${item.repositoryName} / ${item.branch}` : "Stable State"}
                  </strong>
                  <span style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>{item.severity || "low"}</span>
                </div>
                <div style={{ color: "#cbd5e1", fontSize: 13 }}>{item.message}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recurring Issue Patterns" subtitle="Most common failure themes">
          <div style={{ display: "grid", gap: 12 }}>
            {(overview?.topIssues?.length ? overview.topIssues : [{ issue: "No repeated issue detected", count: 0 }]).map((item) => (
              <div key={item.issue} style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#e2e8f0", fontSize: 13 }}>
                  <span style={{ textTransform: "capitalize" }}>{item.issue}</span>
                  <strong>{item.count}</strong>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "rgba(148,163,184,0.12)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(item.count * 18, 100)}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "linear-gradient(90deg, #14b8a6, #38bdf8)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}
