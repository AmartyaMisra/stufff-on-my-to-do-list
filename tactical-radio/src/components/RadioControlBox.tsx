import React from 'react';
import { Power } from 'lucide-react';
import { RotaryKnob } from './RotaryKnob';

interface RadioControlBoxProps {
    isOn: boolean;
    togglePower: () => void;
    volume: number;
    setVolume: (vol: number) => void;
    isLocked: boolean;
}

export const RadioControlBox: React.FC<RadioControlBoxProps> = ({ isOn, togglePower, volume, setVolume, isLocked }) => {
    return (
        <div className="bg-black/90 border border-tactical-dim rounded-lg px-4 flex items-center gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden h-16">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-tactical-grid opacity-10 pointer-events-none"></div>

            {/* Power Section */}
            <div className="flex flex-col items-center gap-0.5 z-10">
                <button
                    onClick={togglePower}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shadow-lg group ${isOn
                        ? 'border-tactical-highlight bg-tactical-highlight/10 shadow-[0_0_20px_rgba(0,255,0,0.3)]'
                        : 'border-red-900 bg-red-900/10 hover:border-red-500'
                        }`}
                >
                    <Power size={18} className={`transition-colors ${isOn ? 'text-tactical-highlight' : 'text-red-900 group-hover:text-red-500'}`} />
                </button>
                <div className="text-[7px] text-tactical-dim tracking-widest font-bold">PWR</div>
            </div>

            {/* Status Display */}
            <div className="flex flex-col gap-0.5">
                <div className="h-8 w-24 bg-black border border-tactical-dim rounded flex items-center justify-center relative overflow-hidden">
                    <div className={`text-sm font-mono font-bold tracking-widest ${isOn ? 'text-tactical-highlight animate-pulse' : 'text-tactical-dim/20'}`}>
                        {isOn ? (isLocked ? "LOCKED" : "SCAN") : "OFF"}
                    </div>
                </div>
                {isOn && <div className="text-[8px] font-mono text-tactical-dim text-center">SNR: -105dBm</div>}
            </div>

            {/* Volume Section */}
            <div className="z-10 scale-75 origin-center">
                <RotaryKnob value={volume} onChange={setVolume} label="GAIN" />
            </div>
        </div>
    );
};
