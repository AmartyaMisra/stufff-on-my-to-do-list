import React, { useRef, useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000";

/**
 * Waterfall Display - Shows FRB spectrograms and event timeline
 * Creates a visual "waterfall" of detected signals over time
 */
export default function Waterfall({ events = [] }) {
  const canvasRef = useRef();
  const [frbEvents, setFrbEvents] = useState([]);
  const [latestFRB, setLatestFRB] = useState(null);

  // Filter FRB events
  useEffect(() => {
    const frbs = events.filter(e => e.channel === "frb");
    setFrbEvents(frbs);
  }, [events]);

  // Fetch latest FRB for detail display
  const fetchLatestFRB = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE}/api/frb/latest`);
      if (r.data.available) {
        setLatestFRB(r.data);
      }
    } catch (e) {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchLatestFRB();
    const interval = setInterval(fetchLatestFRB, 15000);
    return () => clearInterval(interval);
  }, [fetchLatestFRB]);

  // Draw waterfall/spectrogram visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#050a10";
    ctx.fillRect(0, 0, width, height);

    // Draw frequency axis (left side)
    ctx.strokeStyle = "#1a3a4a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 10);
    ctx.lineTo(30, height - 20);
    ctx.stroke();

    // Frequency labels
    ctx.fillStyle = "#4a6a7a";
    ctx.font = "9px JetBrains Mono";
    ctx.textAlign = "right";
    ctx.fillText("800", 25, 20);
    ctx.fillText("600", 25, height / 2);
    ctx.fillText("400", 25, height - 25);
    ctx.fillText("MHz", 25, height - 10);

    // Draw time axis (bottom)
    ctx.textAlign = "center";
    ctx.fillText("Time →", width / 2, height - 5);

    // Draw waterfall grid
    ctx.strokeStyle = "#0a1a2a";
    for (let y = 20; y < height - 20; y += 20) {
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
    }

    // If we have FRB events, draw them as spectral bursts
    if (frbEvents.length > 0) {
      const now = Date.now();
      const timeWindow = 5 * 60 * 1000; // 5 minutes

      frbEvents.forEach((frb, idx) => {
        // Fix: Use 'timestamp' matching App.jsx mapping
        const eventTime = new Date(frb.timestamp).getTime();
        const age = now - eventTime;

        if (age > timeWindow) return; // Skip old events

        // Calculate position
        const xPos = 35 + ((timeWindow - age) / timeWindow) * (width - 45);

        // Safety check to prevent crashes
        if (!Number.isFinite(xPos)) return;

        const dm = frb.payload?.dm || 500;
        const snr = frb.payload?.snr || 20;

        // Draw dispersed burst (diagonal streak)
        const burstWidth = Math.max(3, snr / 10);
        const burstHeight = height - 40;
        const dispersionSlope = dm / 1000; // More DM = more diagonal

        const x1 = xPos;
        const y1 = 20;
        const x2 = xPos + burstWidth + dispersionSlope * 50;
        const y2 = height - 20;

        // Create gradient for burst (with safety)
        if (Number.isFinite(x2)) {
          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          gradient.addColorStop(0, "rgba(255, 153, 0, 0.9)");
          gradient.addColorStop(0.5, "rgba(255, 100, 50, 0.7)");
          gradient.addColorStop(1, "rgba(255, 50, 50, 0.3)");
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = "rgba(255, 153, 0, 0.9)";
        }
        ctx.beginPath();
        ctx.moveTo(xPos, 20);
        ctx.lineTo(xPos + burstWidth, 20);
        ctx.lineTo(xPos + burstWidth + dispersionSlope * 30, height - 20);
        ctx.lineTo(xPos + dispersionSlope * 30, height - 20);
        ctx.closePath();
        ctx.fill();

        // Glow effect
        ctx.shadowColor = "#ff9900";
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(255, 153, 0, 0.5)";
        ctx.fillRect(xPos - 2, 15, burstWidth + 4, 5);
        ctx.shadowBlur = 0;
      });
    } else {
      // Draw placeholder "scanning" animation
      const scanPos = (Date.now() / 50) % (width - 45);
      ctx.fillStyle = "rgba(0, 212, 255, 0.1)";
      ctx.fillRect(35 + scanPos - 20, 20, 40, height - 40);

      // Noise pattern
      for (let i = 0; i < 100; i++) {
        const x = 35 + Math.random() * (width - 45);
        const y = 20 + Math.random() * (height - 40);
        const brightness = Math.random() * 30;
        ctx.fillStyle = `rgba(0, 100, 150, ${brightness / 100})`;
        ctx.fillRect(x, y, 2, 2);
      }
    }

  }, [frbEvents]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="panel waterfall-panel">
      <div className="panel-title">
        <span>📊</span> WATERFALL (FRB SNIPPETS)
        {frbEvents.length > 0 && (
          <span style={{
            marginLeft: "auto",
            padding: "2px 6px",
            background: "rgba(255, 153, 0, 0.2)",
            color: "var(--accent-orange)",
            borderRadius: "4px",
            fontSize: "0.65rem"
          }}>
            {frbEvents.length} burst{frbEvents.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={280}
        height={150}
        style={{
          width: "100%",
          height: "150px",
          borderRadius: "4px",
          background: "#050a10"
        }}
      />

      {latestFRB ? (
        <div
          className="frb-detail"
          style={{
            marginTop: "10px",
            padding: "8px",
            background: "rgba(255, 153, 0, 0.05)",
            borderRadius: "4px",
            fontSize: "0.7rem"
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px"
          }}>
            <span style={{ color: "var(--accent-orange)" }}>
              {latestFRB.source_name}
            </span>
            <span style={{ color: "var(--text-muted)" }}>
              {formatTime(latestFRB.timestamp)}
            </span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "4px",
            color: "var(--text-secondary)"
          }}>
            <div>DM: {latestFRB.dm?.toFixed(0)}</div>
            <div>SNR: {latestFRB.snr?.toFixed(1)}</div>
            <div>W: {latestFRB.width_ms?.toFixed(2)}ms</div>
          </div>
        </div>
      ) : (
        <div style={{
          marginTop: "10px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "0.75rem",
          fontStyle: "italic"
        }}>
          No FRB events yet.
        </div>
      )}
    </div>
  );
}
