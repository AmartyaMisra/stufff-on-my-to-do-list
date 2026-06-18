import React, { useEffect, useRef } from 'react';
import { AudioEngine } from '../lib/audioEngine';

interface OscilloscopeProps {
    audioEngine: AudioEngine | null;
    isOn: boolean;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ audioEngine, isOn }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        let lastTime = 0;
        const render = (time: number) => {
            animationFrameId = requestAnimationFrame(render);

            // Throttle to 20 FPS
            if (time - lastTime < 50) return;
            lastTime = time;

            // Resize
            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            const width = canvas.width;
            const height = canvas.height;

            ctx.fillStyle = 'rgba(9, 9, 11, 0.2)'; // Fade out effect
            ctx.fillRect(0, 0, width, height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = isOn ? '#10b981' : '#18181b'; // Highlight vs Grid color
            ctx.beginPath();

            // SIMULATED WAVEFORM
            // Since we can't easily get CORS audio data, we simulate a waveform when playing
            const isPlaying = audioEngine?.isPlayingStream();

            if (isOn && isPlaying) {
                const sliceWidth = width * 1.0 / 100;
                let x = 0;
                const waveTime = Date.now() / 50;

                for (let i = 0; i < 100; i++) {
                    // Create a complex wave that looks like audio
                    const v = Math.sin((i * 0.2) + waveTime) * 0.5 +
                        Math.cos((i * 0.5) - waveTime) * 0.3 +
                        Math.random() * 0.1;

                    const y = (height / 2) + (v * (height / 4));

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    x += sliceWidth;
                }
            } else if (isOn) {
                // Just static noise line
                const sliceWidth = width * 1.0 / 50;
                let x = 0;
                for (let i = 0; i < 50; i++) {
                    const noise = (Math.random() - 0.5) * 5;
                    const y = (height / 2) + noise;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                    x += sliceWidth;
                }
            } else {
                // Flatline
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height / 2);
            }

            ctx.stroke();

            // Grid overlay
            ctx.strokeStyle = 'rgba(24, 24, 27, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            // Horizontal line
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            // Vertical line
            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width / 2, height);
            ctx.stroke();
        };

        render(0);

        return () => cancelAnimationFrame(animationFrameId);
    }, [audioEngine, isOn]);

    return (
        <div className="relative w-full h-48 bg-tactical-dark border-t border-b border-tactical-grid">
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute top-2 right-2 text-[10px] text-tactical-dim">SIGNAL.VISUALIZER</div>
        </div>
    );
};
