import React from "react";

/**
 * Threat State Indicator - Tactical Status Display
 */
export default function ThreatIndicator({ status }) {
    const state = status?.state || "QUIET";
    const confidence = status?.confidence || 0;
    const channels = status?.active_channels || [];

    const stateConfig = {
        QUIET: {
            color: "#00ff88",
            bgColor: "rgba(0, 255, 136, 0.05)",
            label: "QUIET",
        },
        LOCAL: {
            color: "#88ff00",
            bgColor: "rgba(136, 255, 0, 0.1)",
            label: "LOCAL",
        },
        MULTI: {
            color: "#ffaa00",
            bgColor: "rgba(255, 170, 0, 0.15)",
            label: "MULTI-CHANNEL",
        },
        HIGH_CONFIDENCE: {
            color: "#ff00ff",
            bgColor: "rgba(255, 0, 255, 0.2)",
            label: "FUSION ALERT",
            pulse: true
        }
    };

    const config = stateConfig[state] || stateConfig.QUIET;

    return (
        <div
            className="threat-indicator"
            style={{
                borderColor: config.color,
                background: config.bgColor,
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                borderWidth: "1px",
                borderStyle: "solid",
                borderRadius: "8px",
                animation: config.pulse ? "pulse-red 1s infinite alternate" : "none"
            }}
        >
            <div style={{
                fontSize: "0.7rem",
                color: "var(--text-secondary)",
                letterSpacing: "1.5px",
                marginBottom: "4px"
            }}>
                SYSTEM STATUS
            </div>

            <div style={{
                fontSize: "1.8rem",
                fontWeight: "700",
                color: config.color,
                marginBottom: "12px",
                fontFamily: "'Orbitron', sans-serif",
                textShadow: `0 0 10px ${config.color}40`
            }}>
                {config.label}
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: "8px 16px",
                fontSize: "0.85rem",
                color: "var(--text-muted)"
            }}>
                <div>Confidence:</div>
                <div style={{ color: "var(--text-primary)", fontWeight: "bold" }}>
                    {(confidence * 100).toFixed(0)}%
                </div>

                <div>Active Channels:</div>
                <div style={{ color: "var(--text-primary)", fontWeight: "bold" }}>
                    {channels.length}
                </div>
            </div>

            {channels.length > 0 && (
                <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {channels.map(ch => (
                        <span key={ch} className={`channel-tag channel-${ch}`} style={{
                            fontSize: "0.65rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255,255,255,0.2)"
                        }}>
                            {ch === 'radio_monitor' ? 'HAM RADIO' : ch.toUpperCase()}
                        </span>
                    ))}
                </div>
            )}

            {/* Fusion Reasons - Evidence Chain */}
            {status?.fusion_reasons?.length > 0 && (
                <div style={{
                    marginTop: "12px",
                    padding: "8px",
                    background: "rgba(255, 0, 255, 0.1)",
                    borderRadius: "4px",
                    borderLeft: "3px solid #ff00ff"
                }}>
                    <div style={{ fontSize: "0.65rem", color: "#ff00ff", marginBottom: "4px", letterSpacing: "1px" }}>
                        FUSION EVIDENCE
                    </div>
                    {status.fusion_reasons.map((reason, i) => (
                        <div key={i} style={{ fontSize: "0.7rem", color: "#e0d0f0", marginBottom: "2px" }}>
                            • {reason}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
