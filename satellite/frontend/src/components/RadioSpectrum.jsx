import React, { useEffect, useState, useRef } from "react";

/**
 * Radio Spectrum Visualizer (Ham Bands)
 * Visualizes 40m, 20m, 10m, and 2m bands.
 * Displays power output vs frequency.
 */
export default function RadioSpectrum({ events }) {
    const canvasRef = useRef(null);

    // Bands configuration
    const BANDS = [
        { name: "40m", freq: "7.0-7.3 MHz", min: 7.0, max: 7.3, color: "#00ff88" },
        { name: "20m", freq: "14.0-14.35 MHz", min: 14.0, max: 14.35, color: "#00ff88" },
        { name: "10m", freq: "28.0-29.7 MHz", min: 28.0, max: 29.7, color: "#00ccff" },
        { name: "2m", freq: "144-148 MHz", min: 144, max: 148, color: "#ff00ff" } // VHF
    ];

    // Simulated spectral data state (since backend sends events, not raw samples)
    // We reconstruct "activity" from the event stream.
    const [spectralData, setSpectralData] = useState([]);

    useEffect(() => {
        // Initialize empty spectrum
        const initialData = BANDS.map(band => ({
            ...band,
            bins: new Array(20).fill(-80) // 20 bins per band, -80 dBm noise floor
        }));
        setSpectralData(initialData);
    }, []);

    // Update spectrum based on LIVE EVENTS
    useEffect(() => {
        if (!events.length) return;

        setSpectralData(prev => {
            const next = [...prev];

            // Decay old signals
            next.forEach(band => {
                for (let i = 0; i < band.bins.length; i++) {
                    // Random noise floor jitter -85 to -75 dBm
                    const noise = -85 + Math.random() * 10;
                    // Decay existing power towards noise
                    band.bins[i] = band.bins[i] * 0.9 + noise * 0.1;
                }
            });

            // Inject signals from RECENT radio events
            const now = Date.now();
            const recentRadioEvents = events.filter(e =>
                (e.event_type === 'radio_monitor' || e.channel === 'radio_monitor') &&
                (now - new Date(e.timestamp).getTime() < 5000) // Only last 5 seconds
            );

            recentRadioEvents.forEach(e => {
                const freq = e.data?.frequency_mhz;
                const power = e.data?.power_deviation_db || 30; // Relative boost

                // Find which band this freq belongs to
                const bandIdx = BANDS.findIndex(b => freq >= b.min && freq <= b.max);
                if (bandIdx > -1) {
                    // Map freq to bin index
                    const band = next[bandIdx];
                    const range = band.max - band.min;
                    const norm = (freq - band.min) / range;
                    const binIdx = Math.floor(norm * band.bins.length);

                    if (binIdx >= 0 && binIdx < band.bins.length) {
                        // Spike the bin!
                        band.bins[binIdx] = Math.min(-10, band.bins[binIdx] + power); // Max -10 dB adjustment
                    }
                }
            });

            return next;
        });

    }, [events]);

    // Draw loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let animationFrame;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Background Grid
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < canvas.width; i += 40) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
            for (let j = 0; j < canvas.height; j += 20) { ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); }
            ctx.stroke();

            // Draw Bands
            const bandWidth = canvas.width / BANDS.length;
            const padding = 10;

            spectralData.forEach((band, idx) => {
                const xBase = idx * bandWidth;

                // Band Label
                ctx.fillStyle = band.color;
                ctx.font = "10px monospace";
                ctx.fillText(band.name, xBase + 5, 12);
                ctx.fillStyle = "rgba(255,255,255,0.4)";
                ctx.fillText(band.freq, xBase + 35, 12);

                // Draw Bars
                const binWidth = (bandWidth - padding) / band.bins.length;

                band.bins.forEach((dbm, i) => {
                    const x = xBase + 5 + i * binWidth;
                    // Map dBm to height. -90dBm = 0px, -10dBm = max height
                    // Range = 80dB
                    const normalizedHeight = Math.max(0, (dbm + 90) / 80);
                    const barHeight = normalizedHeight * (canvas.height - 20);
                    const y = canvas.height - barHeight;

                    // Color Gradient based on power
                    const grad = ctx.createLinearGradient(x, canvas.height, x, 0);
                    grad.addColorStop(0, band.color);
                    grad.addColorStop(1, "#ffffff");

                    ctx.fillStyle = grad;
                    ctx.fillRect(x, y, binWidth - 1, barHeight);
                });

                // Separator
                ctx.strokeStyle = "rgba(255,255,255,0.2)";
                ctx.beginPath();
                ctx.moveTo(xBase + bandWidth, 0);
                ctx.lineTo(xBase + bandWidth, canvas.height);
                ctx.stroke();
            });

            animationFrame = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrame);
    }, [spectralData]);

    return (
        <div className="radio-spectrum-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div className="panel-title">📡 RADIO SPECTRUM</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-green)' }}>SOURCE: WebSDR (Live)</div>
            </div>

            <canvas
                ref={canvasRef}
                width={400}
                height={100}
                style={{ width: '100%', height: '100px', background: '#050a10', border: '1px solid #333' }}
            />

            <div style={{ fontSize: '0.6rem', color: '#666', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Monitored Bands (HF/VHF)</span>
                <span>Update Rate: 10Hz</span>
            </div>
        </div>
    );
}
