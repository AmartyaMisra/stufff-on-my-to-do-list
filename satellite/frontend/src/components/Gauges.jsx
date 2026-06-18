import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000";

/**
 * Space Weather Gauges - Shows real-time NOAA data
 * Colors change based on severity (green → amber → red)
 */
export default function Gauges({ events = [] }) {
  const [spaceweather, setSpaceweather] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch latest space weather data
  const fetchSpaceweather = useCallback(async () => {
    try {
      const r = await axios.get(`${API_BASE}/api/spaceweather/latest`);
      if (r.data.available) {
        setSpaceweather(r.data);
      }
    } catch (e) {
      console.error("Error fetching space weather:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll NOAA data
  const pollNOAA = useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/api/noaa/poll`);
      await fetchSpaceweather();
    } catch (e) {
      // Polling errors are non-critical
    }
  }, [fetchSpaceweather]);

  useEffect(() => {
    fetchSpaceweather();
    pollNOAA(); // Initial poll

    // Poll NOAA every 60 seconds
    const pollInterval = setInterval(pollNOAA, 60000);
    // Refresh display every 10 seconds
    const refreshInterval = setInterval(fetchSpaceweather, 10000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(refreshInterval);
    };
  }, [fetchSpaceweather, pollNOAA]);

  // Get color based on value and thresholds
  const getGaugeColor = (value, type) => {
    if (value === null || value === undefined) return "var(--text-muted)";

    switch (type) {
      case "solar_wind":
        if (value > 600) return "var(--accent-red)";
        if (value > 500) return "var(--accent-orange)";
        if (value > 400) return "var(--accent-yellow)";
        return "var(--accent-green)";

      case "bz":
        // Negative Bz is concerning
        if (value < -15) return "var(--accent-red)";
        if (value < -10) return "var(--accent-orange)";
        if (value < -5) return "var(--accent-yellow)";
        return "var(--accent-green)";

      case "proton":
        if (value > 100) return "var(--accent-red)";
        if (value > 10) return "var(--accent-orange)";
        if (value > 1) return "var(--accent-yellow)";
        return "var(--accent-green)";

      case "density":
        if (value > 20) return "var(--accent-orange)";
        if (value > 10) return "var(--accent-yellow)";
        return "var(--accent-green)";

      default:
        return "var(--accent-cyan)";
    }
  };

  // Format value for display
  const formatValue = (value, unit, decimals = 1) => {
    if (value === null || value === undefined) return "–";
    return `${Number(value).toFixed(decimals)} ${unit}`;
  };

  const severity = spaceweather?.severity || "low";
  const severityColors = {
    low: "var(--accent-green)",
    medium: "var(--accent-yellow)",
    high: "var(--accent-orange)",
    critical: "var(--accent-red)"
  };

  return (
    <div className="panel">
      <div className="panel-title">
        <span>☀️</span> SPACE WEATHER
        {spaceweather && (
          <span
            className="severity-badge"
            style={{
              marginLeft: "auto",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.65rem",
              background: `${severityColors[severity]}20`,
              color: severityColors[severity]
            }}
          >
            {severity.toUpperCase()}
          </span>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading NOAA data...</div>
      ) : (
        <>
          <div className="gauges">
            <Gauge
              label="Solar Wind"
              value={spaceweather?.solar_wind_speed}
              unit="km/s"
              color={getGaugeColor(spaceweather?.solar_wind_speed, "solar_wind")}
            />
            <Gauge
              label="Bz (GSM)"
              value={spaceweather?.bz_gsm}
              unit="nT"
              color={getGaugeColor(spaceweather?.bz_gsm, "bz")}
            />
            <Gauge
              label="Proton Flux"
              value={spaceweather?.proton_flux}
              unit="pfu"
              decimals={2}
              color={getGaugeColor(spaceweather?.proton_flux, "proton")}
            />
          </div>

          {spaceweather?.anomaly_triggers?.length > 0 && (
            <div
              className="anomaly-alerts"
              style={{
                marginTop: "12px",
                padding: "8px",
                background: "rgba(255, 51, 102, 0.1)",
                borderRadius: "4px",
                borderLeft: "3px solid var(--accent-red)"
              }}
            >
              <div style={{ fontSize: "0.7rem", color: "var(--accent-red)", marginBottom: "4px" }}>
                ⚠️ ANOMALY TRIGGERS
              </div>
              {spaceweather.anomaly_triggers.map((trigger, i) => (
                <div key={i} style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  • {trigger}
                </div>
              ))}
            </div>
          )}

          {spaceweather?.timestamp && (
            <div
              className="last-update"
              style={{
                marginTop: "8px",
                fontSize: "0.65rem",
                color: "var(--text-muted)",
                textAlign: "right"
              }}
            >
              Source: NOAA SWPC (Live) &bull; Updated: {new Date(spaceweather.timestamp).toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Gauge({ label, value, unit, decimals = 1, color }) {
  const displayValue = value !== null && value !== undefined
    ? Number(value).toFixed(decimals)
    : "–";

  return (
    <div
      className="gauge"
      style={{ borderColor: color }}
    >
      <div className="gauge-label">{label}</div>
      <div
        className="gauge-value"
        style={{ color }}
      >
        {displayValue}
        <span style={{ fontSize: "0.7rem", marginLeft: "2px", opacity: 0.7 }}>
          {unit}
        </span>
      </div>
    </div>
  );
}
