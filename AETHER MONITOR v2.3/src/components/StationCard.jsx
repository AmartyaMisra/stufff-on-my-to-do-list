import React from 'react';
import { Play, Pause, Loader2, VolumeX, Activity } from 'lucide-react';

export default function StationCard({
    station,
    isPlaying,
    isLoading,
    isCurrent,
    onPlay,
    onStop,
    theme = 'cyan'
}) {
    // Theme color mapping
    const themeColors = {
        cyan: 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20',
        orange: 'text-orange-400 border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20',
        indigo: 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20',
        emerald: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20',
        red: 'text-red-400 border-red-500/50 bg-red-500/10 hover:bg-red-500/20',
        amber: 'text-amber-400 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20',
        blue: 'text-blue-400 border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20',
        violet: 'text-violet-400 border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/20',
    };

    const activeClass = isCurrent
        ? themeColors[theme] || themeColors.cyan
        : 'text-slate-300 border-transparent bg-slate-800/50 hover:bg-slate-700/50 hover:border-slate-600';

    const iconColor = isCurrent ? (themeColors[theme]?.split(' ')[0] || 'text-cyan-400') : 'text-slate-500';

    return (
        <div className={`w-full p-3 rounded-lg border transition-all flex items-center gap-3 group ${activeClass}`}>
            {/* Status Indicator */}
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isCurrent && isPlaying
                ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]'
                : station.active !== false ? 'bg-slate-600' : 'bg-red-500/50'
                }`} />

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className="text-sm font-bold truncate tracking-wide">
                        {station.name || station.city}
                    </div>
                    {station.freq && (
                        <span className="text-[10px] font-mono opacity-60 bg-black/30 px-1 rounded">
                            {station.freq}
                        </span>
                    )}
                </div>
                <div className="text-[10px] opacity-70 truncate font-mono">
                    {station.description || station.country || 'Unknown Region'}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                {isCurrent && isPlaying ? (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); onStop(); }}
                            className="p-2 rounded-full hover:bg-black/20 transition-colors"
                            title="Stop"
                        >
                            <VolumeX className="w-4 h-4" />
                        </button>
                        <div className="w-8 h-4 flex items-center justify-center">
                            <Activity className="w-4 h-4 animate-pulse text-emerald-400" />
                        </div>
                    </>
                ) : (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPlay(station); }}
                        disabled={station.active === false}
                        className={`p-2 rounded-full hover:bg-black/20 transition-colors ${station.active === false ? 'cursor-not-allowed opacity-50' : ''}`}
                        title="Play"
                    >
                        {isLoading && isCurrent ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className={`w-4 h-4 ${iconColor}`} />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
