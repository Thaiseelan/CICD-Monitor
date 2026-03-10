import { useEffect, useRef } from "react";

export default function LogsViewer({ logs }) {
  const logContainerRef = useRef(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  console.log("LogsViewer receives logs:", logs);

  return (
    <div
      ref={logContainerRef}
      style={{
        background: "#000",
        color: "#0f0",
        fontFamily: "monospace",
        fontSize: 14,
        padding: 10,
        borderRadius: 5,
        height: 300,
        overflowY: "auto",
        whiteSpace: "pre-wrap",
        border: "1px solid #333"
      }}
    >
      {logs.length === 0 ? (
        <div style={{ color: "#666" }}>No logs available</div>
      ) : (
        logs.map((log, index) => (
          <div key={log._id || index}>
            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
          </div>
        ))
      )}
    </div>
  );
}