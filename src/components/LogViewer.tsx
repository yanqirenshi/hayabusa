"use client";

import React, { useState, useEffect } from "react";
import { getLogsAction, clearLogsAction } from "@/app/actions/logActions";
import { LogEntry, LogLevel } from "@/core/Logger";

export default function LogViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterText, setFilterText] = useState("");
  const [activeLevels, setActiveLevels] = useState<Set<LogLevel>>(new Set(["INFO", "WARN", "ERROR"]));
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [drawerWidth, setDrawerWidth] = useState(500);

  const toggleLevel = (level: LogLevel) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const fetchLogs = async () => {
    try {
      const serverLogs = await getLogsAction();
      setLogs(serverLogs);
    } catch (e) {
      // Intentionally not using Logger here to avoid infinite loops if it fails
      console.error("Failed to fetch logs", e);
    }
  };

  useEffect(() => {
    fetchLogs(); // Initial fetch on mount
  }, []);

  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh]);

  const handleClear = async () => {
    await clearLogsAction();
    setLogs([]);
  };

  const filteredLogs = logs.filter((log) => {
    if (!activeLevels.has(log.level)) return false;
    if (filterText) {
      const lower = filterText.toLowerCase();
      return log.message.toLowerCase().includes(lower) || (log.details && log.details.toLowerCase().includes(lower));
    }
    return true;
  });

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case "INFO": return "#3b82f6";
      case "WARN": return "#eab308";
      case "ERROR": return "#ef4444";
      default: return "#888";
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => { setIsOpen(true); fetchLogs(); }}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
          padding: "10px 20px",
          backgroundColor: "#1f2937",
          color: "white",
          border: "none",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          cursor: "pointer",
          fontWeight: "bold",
          display: isOpen ? "none" : "block",
        }}
      >
        View Logs ({logs.length})
      </button>

      {/* Drawer */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: `${drawerWidth}px`,
            height: "100vh",
            backgroundColor: "#fff",
            boxShadow: "-4px 0 15px rgba(0,0,0,0.1)",
            zIndex: 10000,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #e5e7eb",
          }}
        >
          {/* Resizer Handle */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = drawerWidth;

              const onMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = startX - moveEvent.clientX;
                const newWidth = Math.max(300, Math.min(startWidth + deltaX, window.innerWidth - 50));
                setDrawerWidth(newWidth);
              };

              const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
              };

              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("mouseup", onMouseUp);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: "-3px",
              width: "6px",
              height: "100%",
              cursor: "col-resize",
              zIndex: 10001,
            }}
          />
          {/* Header */}
          <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#111827" }}>System Logs</h2>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#6b7280" }}
            >
              &times;
            </button>
          </div>

          {/* Toolbar */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ flex: 1, padding: "6px 10px", borderRadius: "4px", border: "1px solid #d1d5db" }}
            />
            <div style={{ display: "flex", gap: "6px" }}>
              {(["INFO", "WARN", "ERROR"] as LogLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    border: `1px solid ${getLevelColor(level)}`,
                    backgroundColor: activeLevels.has(level) ? getLevelColor(level) : "transparent",
                    color: activeLevels.has(level) ? "white" : getLevelColor(level),
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    transition: "all 0.2s"
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: "8px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#4b5563" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              Auto Refresh (3s)
            </label>
            <div>
              <button onClick={fetchLogs} style={{ marginRight: "10px", background: "none", border: "1px solid #d1d5db", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>Refresh</button>
              <button onClick={handleClear} style={{ background: "none", border: "1px solid #ef4444", color: "#ef4444", padding: "4px 8px", borderRadius: "4px", cursor: "pointer" }}>Clear All</button>
            </div>
          </div>

          {/* Log List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", backgroundColor: "#f3f4f6" }}>
            {filteredLogs.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9ca3af", marginTop: "2rem" }}>No logs found.</div>
            ) : (
              filteredLogs.slice().reverse().map((log) => (
                <div key={log.id} style={{ marginBottom: "12px", backgroundColor: "white", borderRadius: "6px", padding: "12px", borderLeft: `4px solid ${getLevelColor(log.level)}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.8rem", color: "#6b7280" }}>
                    <span style={{ fontWeight: "bold", color: getLevelColor(log.level) }}>{log.level}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ color: "#1f2937", fontSize: "0.95rem", wordBreak: "break-word", whiteSpace: "pre-wrap" }}>
                    {log.message}
                  </div>
                  {log.details && (
                    <pre style={{ marginTop: "8px", padding: "8px", backgroundColor: "#f8fafc", borderRadius: "4px", fontSize: "0.8rem", overflowX: "auto", color: "#475569", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {log.details}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
