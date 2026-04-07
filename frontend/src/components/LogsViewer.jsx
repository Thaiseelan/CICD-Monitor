import { useEffect, useRef } from "react";

function getLogVariant(message = "") {
  const value = message.toLowerCase();

  if (value.includes("fail") || value.includes("error")) {
    return {
      label: "Issue",
      accent: "#fda4af",
      badgeBg: "rgba(190, 24, 93, 0.16)",
      rowBg: "rgba(127, 29, 29, 0.16)",
    };
  }

  if (value.includes("success") || value.includes("complete")) {
    return {
      label: "Done",
      accent: "#86efac",
      badgeBg: "rgba(22, 101, 52, 0.18)",
      rowBg: "rgba(20, 83, 45, 0.14)",
    };
  }

  if (value.includes("install") || value.includes("clone") || value.includes("run")) {
    return {
      label: "Step",
      accent: "#7dd3fc",
      badgeBg: "rgba(8, 145, 178, 0.16)",
      rowBg: "rgba(12, 74, 110, 0.14)",
    };
  }

  return {
    label: "Log",
    accent: "#cbd5e1",
    badgeBg: "rgba(51, 65, 85, 0.45)",
    rowBg: "rgba(15, 23, 42, 0.38)",
  };
}

export default function LogsViewer({ logs }) {
  const logContainerRef = useRef(null);
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null;

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(15, 23, 42, 0.72)",
            border: "1px solid rgba(148, 163, 184, 0.16)",
            color: "#e2e8f0",
            fontSize: 12,
          }}
        >
          {logs.length} log {logs.length === 1 ? "entry" : "entries"}
        </div>
        {latestLog ? (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(15, 23, 42, 0.72)",
              border: "1px solid rgba(148, 163, 184, 0.16)",
              color: "#94a3b8",
              fontSize: 12,
            }}
          >
            Latest at {new Date(latestLog.timestamp).toLocaleTimeString()}
          </div>
        ) : null}
      </div>

      <div
        ref={logContainerRef}
        style={{
          background:
            "linear-gradient(180deg, rgba(2, 6, 23, 0.96), rgba(15, 23, 42, 0.96))",
          color: "#e2e8f0",
          fontFamily: "Consolas, 'Courier New', monospace",
          fontSize: 14,
          lineHeight: 1.6,
          padding: 16,
          borderRadius: 16,
          minHeight: 300,
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          border: "1px solid rgba(148, 163, 184, 0.18)",
          boxShadow: "inset 0 1px 0 rgba(148, 163, 184, 0.08)",
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: "#94a3b8" }}>No logs available</div>
        ) : (
          logs.map((log, index) => {
            const variant = getLogVariant(log.message);

            return (
              <div
                key={log._id || index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto auto 1fr",
                  alignItems: "start",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  marginBottom: index === logs.length - 1 ? 0 : 8,
                  background: variant.rowBg,
                  border: "1px solid rgba(148, 163, 184, 0.08)",
                }}
              >
                <span style={{ color: "#38bdf8" }}>
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: variant.badgeBg,
                    color: variant.accent,
                    fontSize: 11,
                    lineHeight: 1.6,
                    fontFamily: "Segoe UI, sans-serif",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {variant.label}
                </span>
                <span style={{ color: "#e2e8f0" }}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
