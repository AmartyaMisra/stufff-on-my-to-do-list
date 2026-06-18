import { useEffect, useRef } from 'react';

export const NetworkStats: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let dataPoints: number[] = new Array(50).fill(0);
        let frame = 0;

        let lastTime = 0;
        const draw = (time: number) => {
            requestAnimationFrame(draw);

            // Throttle to 15 FPS
            if (time - lastTime < 66) return;
            lastTime = time;

            frame++;
            // Simulate traffic
            if (frame % 5 === 0) {
                const newValue = Math.random() * 0.8 + 0.1;
                dataPoints.push(newValue);
                dataPoints.shift();
            }

            // Resize
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            const w = canvas.width;
            const h = canvas.height;

            // Clear
            ctx.fillStyle = '#001100';
            ctx.fillRect(0, 0, w, h);

            // Grid
            ctx.strokeStyle = '#003300';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = 0; x < w; x += 20) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
            }
            for (let y = 0; y < h; y += 20) {
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
            }
            ctx.stroke();

            // Graph
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const step = w / (dataPoints.length - 1);
            dataPoints.forEach((val, i) => {
                const x = i * step;
                const y = h - (val * h);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Fill under graph
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.fill();
        };

        const anim = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(anim);
    }, []);

    return (
        <div className="border border-tactical-dim bg-black/50 p-2 rounded relative overflow-hidden h-24">
            <div className="absolute top-1 left-2 text-[10px] text-tactical-dim tracking-widest">NET.TRAFFIC</div>
            <div className="absolute top-1 right-2 text-[10px] text-tactical-highlight animate-pulse">LIVE</div>
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
};
