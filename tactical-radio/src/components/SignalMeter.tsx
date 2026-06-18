import { useEffect, useState } from 'react';

interface SignalMeterProps {
    level: number; // 0 to 1
}

export const SignalMeter: React.FC<SignalMeterProps> = ({ level }) => {
    const [bars, setBars] = useState<number[]>(new Array(20).fill(0));

    useEffect(() => {
        // Create a visual decay effect
        const interval = setInterval(() => {
            setBars(prev => prev.map((val, i) => {
                const target = i / 20 < level ? 1 : 0;
                // Add some noise
                const noise = Math.random() * 0.2;
                return target > 0 ? 1 : Math.max(0, val - 0.1 + noise);
            }));
        }, 50);
        return () => clearInterval(interval);
    }, [level]);

    return (
        <div className="flex items-end gap-[2px] h-8 w-full">
            {bars.map((val, i) => {
                const isActive = i / 20 < level;
                const colorClass = i > 15 ? 'bg-red-500' : (i > 10 ? 'bg-yellow-500' : 'bg-tactical-highlight');

                return (
                    <div
                        key={i}
                        className={`flex-1 rounded-sm transition-all duration-75 ${isActive ? colorClass : 'bg-tactical-dim/20'}`}
                        style={{
                            height: isActive ? `${Math.random() * 30 + 70}%` : '10%',
                            opacity: isActive ? 1 : 0.3
                        }}
                    />
                );
            })}
        </div>
    );
};
