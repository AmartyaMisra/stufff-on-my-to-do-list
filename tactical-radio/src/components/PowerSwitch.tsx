import React from 'react';
import { Power, Lock } from 'lucide-react';

interface PowerSwitchProps {
    isOn: boolean;
    togglePower: () => void;
}

export const PowerSwitch: React.FC<PowerSwitchProps> = ({ isOn, togglePower }) => {
    return (
        <div className="flex flex-col items-center justify-center p-6 border-t border-tactical-grid bg-tactical-dark/50 backdrop-blur-sm">
            <div className="mb-4 text-xs tracking-widest text-tactical-text/50">MASTER CONTROL</div>

            <button
                onClick={togglePower}
                className={`
          group relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-300
          ${isOn
                        ? 'border-tactical-highlight bg-tactical-highlight/10 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                        : 'border-tactical-alert bg-tactical-alert/5 hover:bg-tactical-alert/10'
                    }
        `}
            >
                <Power
                    size={48}
                    className={`transition-all duration-300 ${isOn ? 'text-tactical-highlight drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'text-tactical-alert'}`}
                />

                {/* Ring Animation */}
                {isOn && (
                    <div className="absolute inset-0 rounded-full border border-tactical-highlight animate-pulse-slow opacity-50"></div>
                )}
            </button>

            <div className="mt-4 h-6 text-center">
                {isOn ? (
                    <span className="text-tactical-highlight text-xs tracking-widest animate-pulse">SYSTEM ONLINE</span>
                ) : (
                    <div className="flex items-center gap-2 text-tactical-alert text-xs tracking-widest">
                        <Lock size={12} />
                        <span>ENCRYPTED</span>
                    </div>
                )}
            </div>
        </div>
    );
};
