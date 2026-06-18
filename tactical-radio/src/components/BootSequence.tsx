import React, { useState, useEffect, useRef } from 'react';

interface BootSequenceProps {
    onComplete: () => void;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
    const [lines, setLines] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const bootText = [
        "INITIALIZING TACTICAL KERNEL...",
        "LOADING MEMORY BLOCKS... [OK]",
        "MOUNTING VIRTUAL FILESYSTEM... [OK]",
        "BYPASSING SECURITY PROTOCOLS...",
        "ACCESSING GLOBAL SATELLITE NETWORK...",
        "DECRYPTING FREQUENCY TABLE...",
        "ESTABLISHING SECURE UPLINK...",
        "PING: 12ms",
        "PACKET LOSS: 0.0%",
        "LOADING AUDIO ENGINE... [OK]",
        "INITIALIZING 3D GEOSPATIAL RENDERER...",
        "SYSTEM READY."
    ];

    useEffect(() => {
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex >= bootText.length) {
                clearInterval(interval);
                setTimeout(onComplete, 800);
                return;
            }

            setLines(prev => [...prev, bootText[currentIndex]]);
            currentIndex++;

            // Randomize speed for realism
        }, 150);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [lines]);

    return (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center font-mono text-green-500 p-8">
            <div className="w-full max-w-2xl border border-green-500/30 bg-black/90 p-6 rounded shadow-[0_0_50px_rgba(0,255,0,0.1)]">
                <div className="mb-4 border-b border-green-500/30 pb-2 flex justify-between items-center">
                    <span className="text-xl font-bold tracking-widest">TACTICAL_OS V2.0</span>
                    <span className="animate-pulse">BOOT_SEQUENCE</span>
                </div>
                <div ref={scrollRef} className="h-64 overflow-y-auto space-y-1 scrollbar-hide">
                    {lines.map((line, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
                            <span className="typing-effect">{line}</span>
                        </div>
                    ))}
                    <div className="animate-pulse">_</div>
                </div>
            </div>
        </div>
    );
};
