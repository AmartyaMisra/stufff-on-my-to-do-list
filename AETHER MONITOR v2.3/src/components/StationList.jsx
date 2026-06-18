import React from 'react';
import StationCard from './StationCard';

export default function StationList({
    stations,
    currentStation,
    isPlaying,
    isLoading,
    onPlay,
    onStop,
    theme = 'cyan'
}) {
    if (!stations || stations.length === 0) {
        return (
            <div className="p-4 text-center text-slate-500 text-xs font-mono">
                NO SIGNAL DETECTED
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {stations.map((station) => (
                <StationCard
                    key={station.id}
                    station={station}
                    isCurrent={currentStation?.id === station.id}
                    isPlaying={isPlaying}
                    isLoading={isLoading}
                    onPlay={onPlay}
                    onStop={onStop}
                    theme={theme}
                />
            ))}
        </div>
    );
}
