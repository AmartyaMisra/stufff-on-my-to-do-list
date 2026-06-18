import React, { useState, useEffect, useRef } from 'react';

interface RotaryKnobProps {
    value: number; // 0 to 1
    onChange: (value: number) => void;
    label?: string;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({ value, onChange, label }) => {
    const [isDragging, setIsDragging] = useState(false);
    const knobRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number>(0);
    const startValue = useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startValue.current = value;
        document.body.style.cursor = 'ns-resize';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const deltaY = startY.current - e.clientY;
            const sensitivity = 0.005;
            const newValue = Math.min(1, Math.max(0, startValue.current + deltaY * sensitivity));
            onChange(newValue);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.body.style.cursor = 'default';
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onChange]);

    // Calculate rotation: 0 to 1 maps to -135deg to +135deg
    const rotation = -135 + value * 270;

    return (
        <div className="flex flex-col items-center gap-1 select-none">
            <div
                className="relative w-10 h-10 rounded-full bg-gradient-to-b from-gray-700 to-black border-2 border-tactical-dim shadow-lg cursor-ns-resize group"
                onMouseDown={handleMouseDown}
                ref={knobRef}
            >
                {/* Indicator Line */}
                <div
                    className="absolute w-1 h-1/2 bg-tactical-highlight top-1 left-1/2 -translate-x-1/2 origin-bottom rounded-full shadow-[0_0_10px_rgba(0,255,0,0.5)]"
                    style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
                />
                {/* Center Cap */}
                <div className="absolute inset-2 rounded-full bg-black/80 border border-gray-800"></div>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 bg-tactical-highlight transition-opacity"></div>
            </div>
            {label && <div className="text-[8px] text-tactical-dim tracking-widest font-bold">{label}</div>}
            <div className="text-[10px] text-tactical-highlight font-mono">{(value * 100).toFixed(0)}%</div>
        </div>
    );
};
