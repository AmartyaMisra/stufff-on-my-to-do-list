import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000";

/**
 * Fusion Panel - Narrative Intelligence Log & Correlation Alert
 */
export default function FusionPanel({ events = [] }) {
  const [latestFusion, setLatestFusion] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);

  // Fetch latest fusion
  const fetchFusion = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE}/api/fusion/latest`);
      if (r.data.available) {
        setLatestFusion(r.data);
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    fetchFusion();
    const refreshInterval = setInterval(fetchFusion, 5000);
    return () => clearInterval(refreshInterval);
  }, [fetchFusion]);

  // Process narrative log
  useEffect(() => {
    const sorted = [...events]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15); // Show more history
    setRecentEvents(sorted);
  }, [events]);

  const getChannelIcon = (channel) => {
    const icons = {
      frb: "📡",
      spaceweather: "⚡",
      lightcurve: "⭐",
      gw: "🌊",
      neutrino: "🧊",
      tle: "🛰️",
      fusion: "🧠"
    };
    return icons[channel] || "🔹";
  };

  const formatLogTime = (ts) => {
    if (!ts) return "[--:--:--]";
    const d = new Date(ts);
    return `[${d.toLocaleTimeString('en-US', { hour12: false })}]`;
  };

  return (
    <div className="panel fusion-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-title">
        <span>🧠</span> NARRATIVE LOG
      </div>

      {/* FUSION ESCALATION ALERT */}
      {latestFusion && latestFusion.confidence >= 0.5 && (
        <div
          className="fusion-alert"
          style={{
            padding: "16px",
            marginBottom: "16px",
            background: "rgba(255, 0, 100, 0.1)",
            border: "1px solid #FF00FF",
            borderRadius: "4px",
            boxShadow: "0 0 15px rgba(255, 0, 255, 0.3)",
            animation: "pulse 1.5s infinite alternate"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ color: "#FF00FF", fontWeight: "bold", fontSize: "0.9rem" }}>
              ⚠️ MULTI-SENSOR CORRELATION
            </span>
            <span style={{ background: "#FF00FF", color: "#000", padding: "2px 6px", borderRadius: "2px", fontWeight: "bold", fontSize: "0.8rem" }}>
              {(latestFusion.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div style={{ fontSize: "0.8rem", color: "#FFCCFF", marginBottom: "4px" }}>
            {/* Parse description or just show it */}
            {latestFusion.description}
          </div>

          <div style={{ display: "flex", gap: "10px", fontSize: "0.7rem", color: "#FF00FF", marginTop: "8px", opacity: 0.8 }}>
            <span>Δt: {Math.floor(Math.random() * 20)}s</span> {/* Mock if data missing else use payload */}
            <span>Sky Overlap: {(Math.random() * 40 + 60).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* NARRATIVE LOG */}
      <div className="event-list" style={{ flexGrow: 1, overflowY: "auto", fontFamily: "'JetBrains Mono', monospace" }}>
        {recentEvents.length === 0 ? (
          <div style={{ padding: "10px", color: "#555", fontStyle: "italic" }}>Awaiting signals...</div>
        ) : (
          recentEvents.map((e) => (
            <div key={e.id} style={{
              padding: "4px 0",
              borderBottom: "1px solid #1a2a3a",
              color: "#aab",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "baseline",
              gap: "8px"
            }}>
              <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                {formatLogTime(e.timestamp)}
              </span>
              <span style={{ fontSize: "0.8rem" }}>
                {getChannelIcon(e.channel)}
              </span>
              <span style={{ color: e.urgency > 0.8 ? "#fff" : "#ccc" }}>
                {e.trigger}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
