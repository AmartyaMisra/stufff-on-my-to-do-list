import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const COLORS = {
  spaceweather: "#FFD700", // Yellow
  frb: "#FF9500",          // Orange
  neutrino: "#00FFFF",     // Cyan
  fusion: "#FF00FF",       // Magenta
  gw: "#9933FF",           // Purple
  radio_monitor: "#00ff88",// Green (NEW: Radio listening channel)
  tle: "#888888",          // Gray (Known transmitters - low priority)
  silence: "#ff3366",      // Red (Negative-space: missing signal)
  lightcurve: "#CCCCCC",   // Light Gray
  unknown: "#888888"       // Gray
};

// Visual treatment for UNCLASSIFIED signals (hollow, flickering)
const isUnclassified = (event) => {
  const classification = event.data?.classification;
  return classification && (
    classification.includes("UNCLASSIFIED") ||
    classification.includes("UNKNOWN")
  );
};

const MIN_RADIUS = 20;

export default function Radar({ events = [], threatState = "QUIET", onEventSelect }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [sweepAngle, setSweepAngle] = useState(0);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  // Handle Resize
  useEffect(() => {
    const activeChannels = Array.from(new Set(events.map(e => e.channel)))
      .map(c => c === 'radio_monitor' ? 'HAM RADIO' : c.toUpperCase());
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Keep it square/circular based on the smaller dimension
        const size = Math.min(clientWidth, clientHeight);
        setDimensions({ width: size, height: size });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init based on current layout

    // ResizeObserver for more robust container tracking
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  // Sweep Animation Loop
  useEffect(() => {
    let animationFrame;
    const animate = () => {
      setSweepAngle(prev => (prev + 1.2) % 360); // 1.2 deg/frame
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Drawing Logic
  useEffect(() => {
    if (!svgRef.current) return;

    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    // Allow some padding for labels
    const maxRadius = (Math.min(width, height) / 2) - 40;
    const MAX_RANGE = maxRadius - MIN_RADIUS;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    // -- TACTICAL GRIDS --

    // External Rim
    svg.append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", maxRadius)
      .attr("fill", "#050810")
      .attr("stroke", "#00d4ff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.8);

    // Dynamic Rings (25%, 50%, 75%)
    [0.25, 0.5, 0.75].forEach(ratio => {
      svg.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", maxRadius * ratio)
        .attr("fill", "none")
        .attr("stroke", "#1a2a40")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 4");
    });

    // Crosshairs
    const axisColor = "#1a3a50";
    svg.append("line").attr("x1", centerX).attr("y1", centerY - maxRadius).attr("x2", centerX).attr("y2", centerY + maxRadius).attr("stroke", axisColor);
    svg.append("line").attr("x1", centerX - maxRadius).attr("y1", centerY).attr("x2", centerX + maxRadius).attr("y2", centerY).attr("stroke", axisColor);

    // Degree Ticks
    for (let i = 0; i < 360; i += 15) {
      const rad = (i * Math.PI) / 180;
      const rInner = maxRadius + 5;
      const rOuter = maxRadius + (i % 90 === 0 ? 15 : 8);

      svg.append("line")
        .attr("x1", centerX + Math.cos(rad) * rInner)
        .attr("y1", centerY + Math.sin(rad) * rInner)
        .attr("x2", centerX + Math.cos(rad) * rOuter)
        .attr("y2", centerY + Math.sin(rad) * rOuter)
        .attr("stroke", i % 90 === 0 ? "#00d4ff" : "#1a3a50")
        .attr("stroke-width", i % 90 === 0 ? 2 : 1);

      if (i % 90 === 0) {
        svg.append("text")
          .attr("x", centerX + Math.cos(rad) * (rOuter + 15))
          .attr("y", centerY + Math.sin(rad) * (rOuter + 15))
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .attr("fill", "#00d4ff")
          .style("font-size", "10px")
          .style("font-family", "Orbitron, sans-serif")
          .text(i + "°");
      }
    }

    // --- SWEEP ---
    const rad = (sweepAngle * Math.PI) / 180;
    // Offset -90 deg to start top-dead-center
    const sweepRad = rad - Math.PI / 2;

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(maxRadius)
      .startAngle(sweepRad - 0.25) // Trail angle
      .endAngle(sweepRad);

    // Sweep Gradient
    const sweepGradientId = "sweepGradient";
    // Usually define defs once, but here we redraw. Optimization: Define defs in static render if possible.
    const defs = svg.append("defs");
    // (Skipping complex gradient logic for simplicity, using solid fill with opacity)

    svg.append("path")
      .attr("d", arc)
      .attr("transform", `translate(${centerX}, ${centerY})`)
      .attr("fill", "#00ff88")
      .attr("opacity", 0.15);

    // Leading Edge Line
    svg.append("line")
      .attr("x1", centerX)
      .attr("y1", centerY)
      .attr("x2", centerX + Math.cos(sweepRad) * maxRadius)
      .attr("y2", centerY + Math.sin(sweepRad) * maxRadius)
      .attr("stroke", "#00ff88")
      .attr("stroke-width", 2)
      .attr("stroke-linecap", "round")
      .attr("filter", "drop-shadow(0 0 4px #00ff88)");

    // --- BLIPS ---
    events.forEach(e => {
      // Age Logic
      // Fix Timezone Bug: Ensure timestamp is treated as UTC
      const ts = e.timestamp.endsWith("Z") ? e.timestamp : e.timestamp + "Z";
      const ageSeconds = (Date.now() - new Date(ts).getTime()) / 1000;
      const MAX_AGE = 60;
      const opacity = Math.max(0.1, 1 - (ageSeconds / MAX_AGE));

      if (ageSeconds > MAX_AGE + 10) return;

      // Position Logic
      const r = MIN_RADIUS + (1 - (e.urgency || 0)) * MAX_RANGE;
      const theta = ((e.ra || 0) / 360) * 2 * Math.PI - Math.PI / 2;

      const x = centerX + r * Math.cos(theta);
      const y = centerY + r * Math.sin(theta);

      const color = COLORS[e.channel] || COLORS.unknown;

      // FOCUS MODE: Dim non-selected events
      const isSelected = (e.id === selectedEventId);
      const dimFactor = (selectedEventId && !isSelected) ? 0.3 : 1.0;
      const finalOpacity = opacity * dimFactor;

      const g = svg.append("g")
        .style("cursor", "crosshair")
        .on("click", (evt) => {
          evt.stopPropagation();
          if (onEventSelect) {
            onEventSelect(e);
            // Force re-render
            setSelectedEventId(e.id);
          }
        })
        .on("mouseenter", (evt) => {
          const rect = svgRef.current.getBoundingClientRect();
          setHoverPos({ x: evt.clientX - rect.left, y: evt.clientY - rect.top });
          setHoveredEvent({ ...e, age: ageSeconds.toFixed(1) });
        })
        .on("mouseleave", () => setHoveredEvent(null));

      // Blip Shape (priority visual for selected)
      if (isSelected) {
        // SELECTED EVENT - Large pulsing white ring
        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 25)
          .attr("fill", "none")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 2)
          .attr("opacity", 0.8);

        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 15)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .attr("opacity", 1)
          .append("animate")
          .attr("attributeName", "r")
          .attr("from", 15).attr("to", 30)
          .attr("dur", "1.5s").attr("repeatCount", "indefinite");
      }

      // Visual treatment based on signal type
      if (e.event_type === "fusion" || (e.score > 20)) {
        // HIGH VALUE TARGET → Diamond
        g.append("path")
          .attr("d", d3.symbol().type(d3.symbolDiamond).size(isSelected ? 150 : 80))
          .attr("transform", `translate(${x}, ${y})`)
          .attr("fill", color)
          .attr("opacity", finalOpacity);

      } else if (isUnclassified(e)) {
        // UNCLASSIFIED SIGNAL → Hollow flickering circle (MYSTERY)
        const baseRadius = isSelected ? 8 : 5;

        // Outer hollow ring (dashed = uncertain)
        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", baseRadius)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", isSelected ? 3 : 2)
          .attr("stroke-dasharray", "3,2")
          .attr("opacity", finalOpacity)
          .append("animate")
          .attr("attributeName", "opacity")
          .attr("values", `${finalOpacity};${finalOpacity * 0.4};${finalOpacity}`)
          .attr("dur", "2s")
          .attr("repeatCount", "indefinite");

        // Inner dot (faint)
        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 2)
          .attr("fill", color)
          .attr("opacity", finalOpacity * 0.6);

      } else if (e.event_type === "silence" || e.data?.is_negative_space) {
        // SILENCE/NEGATIVE-SPACE → Hollow inward-collapsing ring (RED)
        const baseRadius = isSelected ? 18 : 12;

        // Outer collapsing ring
        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", baseRadius)
          .attr("fill", "none")
          .attr("stroke", "#ff3366")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "8,4")
          .attr("opacity", finalOpacity * 0.8)
          .append("animate")
          .attr("attributeName", "r")
          .attr("values", `${baseRadius};${baseRadius * 0.5};${baseRadius}`)
          .attr("dur", "2s")
          .attr("repeatCount", "indefinite");

        // Inner pulse (faint)
        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 3)
          .attr("fill", "#ff3366")
          .attr("opacity", finalOpacity * 0.4);

        // "SILENCE" label
        g.append("text")
          .attr("x", x + 15)
          .attr("y", y + 3)
          .attr("fill", "#ff3366")
          .attr("font-size", "7px")
          .attr("font-family", "monospace")
          .attr("opacity", finalOpacity * 0.9)
          .text("🔇 SILENCE");

      } else if (e.data?.is_known_transmitter || e.event_type === "tle") {
        // KNOWN TRANSMITTER → Small square (low visual priority)
        g.append("rect")
          .attr("x", x - 3)
          .attr("y", y - 3)
          .attr("width", isSelected ? 8 : 6)
          .attr("height", isSelected ? 8 : 6)
          .attr("fill", color)
          .attr("stroke", isSelected ? "#fff" : "#000")
          .attr("stroke-width", 1)
          .attr("opacity", finalOpacity * 0.7);

        // Add KNOWN label for transmitters
        const transmitterName = e.data?.name || e.source || "SAT";
        g.append("text")
          .attr("x", x + 8)
          .attr("y", y + 3)
          .attr("fill", "#888")
          .attr("font-size", "8px")
          .attr("font-family", "monospace")
          .attr("opacity", finalOpacity * 0.9)
          .text(`KNOWN: ${transmitterName.substring(0, 6).toUpperCase()}`);

      } else {
        // STANDARD TARGET → Solid circle
        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", isSelected ? 6 : 4)
          .attr("fill", color)
          .attr("stroke", isSelected ? "#fff" : "#000")
          .attr("stroke-width", isSelected ? 2 : 1)
          .attr("opacity", finalOpacity);
      }

      // Flash when new (< 1s old)
      if (ageSeconds < 1.0) {
        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 20)
          .attr("fill", "none")
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("opacity", 1)
          .transition().duration(1000)
          .attr("r", 40)
          .attr("opacity", 0)
          .remove();
      }

    });

  }, [events, dimensions, sweepAngle, selectedEventId]);

  // Track selected event ID locally
  const [selectedEventId, setSelectedEventId] = useState(null);

  return (
    <div className="radar-container" ref={containerRef}>
      <svg ref={svgRef} style={{ display: "block" }} />

      {/* INLINE TOOLTIP - Shows ON the radar, not in side panel */}
      {hoveredEvent && (
        <div style={{
          position: "absolute",
          left: hoverPos.x + 15,
          top: hoverPos.y - 60,
          background: "rgba(0, 5, 10, 0.95)",
          border: `2px solid ${COLORS[hoveredEvent.channel]} `,
          padding: "8px 12px",
          color: "#e0f0ff",
          fontSize: "11px",
          zIndex: 100,
          pointerEvents: "none",
          boxShadow: "0 0 20px rgba(0,0,0,0.8)",
          fontFamily: 'JetBrains Mono, monospace',
          minWidth: '120px'
        }}>
          <div style={{
            color: COLORS[hoveredEvent.channel],
            fontWeight: 'bold',
            fontSize: '13px',
            marginBottom: '4px',
            textTransform: 'uppercase'
          }}>
            {hoveredEvent.channel}
          </div>
          {hoveredEvent.score !== undefined && (
            <div>SNR: <span style={{ color: '#00d4ff', fontWeight: 'bold' }}>{hoveredEvent.score.toFixed(1)}</span></div>
          )}
          <div style={{ fontSize: '10px', color: '#607a90', marginTop: '2px' }}>
            Age: {hoveredEvent.age}s
          </div>
        </div>
      )}

      {/* Overlay Data - top-left corner */}
      <div style={{ position: "absolute", top: 10, left: 10, pointerEvents: "none" }}>
        <div style={{ fontFamily: "Orbitron", fontSize: "14px", color: threatState === "HIGH_CONFIDENCE" ? "#ff2a2a" : "#00ff88", fontWeight: "bold" }}>
          STATUS: {threatState}
        </div>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: "10px", color: "#607a90", marginTop: '4px' }}>
          RANGE: 100 AU • SENSORS: ACTIVE
        </div>
        {selectedEventId && (
          <div style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(0, 212, 255, 0.2)',
            border: '1px solid #00d4ff',
            fontSize: '10px',
            color: '#00d4ff',
            fontWeight: 'bold'
          }}>
            FOCUS MODE
          </div>
        )}
      </div>
    </div>
  );
}
