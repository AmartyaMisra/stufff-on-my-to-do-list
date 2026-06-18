import { Search, Volume2, Play, Pause, SkipForward, SkipBack, Star, MapPin, Satellite } from 'lucide-react';
import type { Station } from '../types';
import type { SatelliteData } from '../lib/satelliteUtils';
import { clsx } from 'clsx';
import { useState } from 'react';

interface DashboardProps {
    stations: Station[];
    satellites: SatelliteData[];
    currentStation: Station | null;
    onSelect: (station: Station) => void;
    onSelectSatellite: (satellite: SatelliteData) => void;
    selectedSatellite: SatelliteData | null;
    isPlaying: boolean;
    togglePlay: () => void;
    filterType: 'ALL' | 'NEWS' | 'MUSIC';
    setFilterType: (type: 'ALL' | 'NEWS' | 'MUSIC') => void;
    search: string;
    setSearch: (search: string) => void;
    volume: number;
    setVolume: (vol: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    stations,
    satellites,
    currentStation,
    onSelect,
    onSelectSatellite,
    selectedSatellite,
    isPlaying,
    togglePlay,
    filterType,
    setFilterType,
    search,
    setSearch,
    volume,
    setVolume
}) => {
    const [viewMode, setViewMode] = useState<'STATIONS' | 'SATELLITES'>('STATIONS');

    const filteredSatellites = satellites.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.includes(search)
    );

    return (
        <div className="h-full flex flex-col gap-4 p-4 border border-tactical-dim rounded-lg bg-black/80 backdrop-blur-md overflow-hidden">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tactical-dim" size={16} />
                <input
                    type="text"
                    placeholder={viewMode === 'STATIONS' ? "SEARCH FREQ..." : "SEARCH ID..."}
                    className="w-full bg-tactical-grid/50 border border-tactical-dim rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-tactical-highlight text-tactical-text placeholder:text-tactical-dim/50 font-bold tracking-wider"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* View Mode Toggles */}
            <div className="flex gap-2 border-b border-tactical-dim/30 pb-2">
                <button
                    onClick={() => setViewMode('STATIONS')}
                    className={clsx(
                        "flex-1 py-2 text-xs font-bold tracking-widest transition-colors flex items-center justify-center gap-2",
                        viewMode === 'STATIONS' ? "text-tactical-highlight border-b-2 border-tactical-highlight" : "text-tactical-dim hover:text-tactical-text"
                    )}
                >
                    <MapPin size={14} /> STATIONS
                </button>
                <button
                    onClick={() => setViewMode('SATELLITES')}
                    className={clsx(
                        "flex-1 py-2 text-xs font-bold tracking-widest transition-colors flex items-center justify-center gap-2",
                        viewMode === 'SATELLITES' ? "text-tactical-highlight border-b-2 border-tactical-highlight" : "text-tactical-dim hover:text-tactical-text"
                    )}
                >
                    <Satellite size={14} /> SATELLITES
                </button>
            </div>

            {/* Filter Buttons (Only for Stations) */}
            {viewMode === 'STATIONS' && (
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterType('ALL')}
                        className={clsx(
                            "flex-1 py-2 rounded border transition-all font-bold text-[10px] tracking-widest",
                            filterType === 'ALL' ? "border-tactical-highlight text-tactical-highlight bg-tactical-highlight/10" : "border-tactical-dim text-tactical-dim"
                        )}
                    >
                        ALL
                    </button>
                    <button
                        onClick={() => setFilterType('NEWS')}
                        className={clsx(
                            "flex-1 py-2 rounded border transition-all font-bold text-[10px] tracking-widest",
                            filterType === 'NEWS' ? "border-tactical-highlight text-tactical-highlight bg-tactical-highlight/10" : "border-tactical-dim text-tactical-dim"
                        )}
                    >
                        NEWS
                    </button>
                    <button
                        onClick={() => setFilterType('MUSIC')}
                        className={clsx(
                            "flex-1 py-2 rounded border transition-all font-bold text-[10px] tracking-widest",
                            filterType === 'MUSIC' ? "border-tactical-highlight text-tactical-highlight bg-tactical-highlight/10" : "border-tactical-dim text-tactical-dim"
                        )}
                    >
                        MUSIC
                    </button>
                </div>
            )}

            {/* Now Playing (Only relevant for Stations) */}
            <div className="border border-tactical-highlight/30 rounded-md p-4 bg-tactical-highlight/5">
                <div className="text-xs text-tactical-highlight mb-2 tracking-[0.2em]">NOW PLAYING</div>
                <div className="text-lg font-bold truncate text-glow mb-3">
                    {currentStation ? currentStation.name : 'WAITING FOR SIGNAL...'}
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button onClick={togglePlay} className="p-2 border border-tactical-highlight text-tactical-highlight rounded hover:bg-tactical-highlight hover:text-black transition-colors">
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                    </div>
                    <div className="flex items-center gap-2 w-1/2">
                        <Volume2 size={16} className="text-tactical-dim" />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-tactical-dim/30 rounded-lg appearance-none cursor-pointer accent-tactical-highlight"
                        />
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="flex items-center gap-2">
                <div className="text-xs text-tactical-dim tracking-widest">
                    {viewMode === 'STATIONS' ? `STATION DATABASE (${stations.length})` : `ORBITAL ASSETS (${filteredSatellites.length})`}
                </div>
                <div className="h-[1px] flex-1 bg-tactical-dim/30"></div>
            </div>

            {/* List Content */}
            <div
                className="flex-1 space-y-2 pr-2 min-h-0"
                style={{
                    overflowY: 'scroll',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#00ff00 #001100'
                }}
            >
                {viewMode === 'STATIONS' ? (
                    stations.map(station => (
                        <button
                            key={station.id}
                            onClick={() => onSelect(station)}
                            className={clsx(
                                "w-full flex items-center justify-between p-3 rounded border transition-all group text-left",
                                currentStation?.id === station.id
                                    ? "border-tactical-highlight bg-tactical-highlight/10"
                                    : "border-transparent hover:border-tactical-dim hover:bg-tactical-grid/30"
                            )}
                        >
                            <div>
                                <div className={clsx(
                                    "text-base font-bold tracking-wide",
                                    currentStation?.id === station.id ? "text-tactical-highlight text-glow" : "text-tactical-text group-hover:text-tactical-highlight"
                                )}>
                                    {station.name}
                                </div>
                                <div className="text-xs text-tactical-dim flex items-center gap-2 mt-1">
                                    <MapPin size={10} />
                                    {station.region} • {station.frequency} MHz
                                </div>
                            </div>
                            {currentStation?.id === station.id && <Star size={16} className="text-tactical-highlight fill-tactical-highlight animate-pulse" />}
                        </button>
                    ))
                ) : (
                    filteredSatellites.map(sat => (
                        <button
                            key={sat.id}
                            onClick={() => onSelectSatellite(sat)}
                            className={clsx(
                                "w-full flex items-center justify-between p-3 rounded border transition-all group text-left",
                                selectedSatellite?.id === sat.id
                                    ? "border-tactical-highlight bg-tactical-highlight/10"
                                    : "border-transparent hover:border-tactical-dim hover:bg-tactical-grid/30"
                            )}
                        >
                            <div>
                                <div className={clsx(
                                    "text-base font-bold tracking-wide",
                                    selectedSatellite?.id === sat.id ? "text-tactical-highlight text-glow" : "text-tactical-text group-hover:text-tactical-highlight"
                                )}>
                                    {sat.name}
                                </div>
                                <div className="text-xs text-tactical-dim flex items-center gap-2 mt-1 font-mono">
                                    <Satellite size={10} />
                                    ID: {sat.id} • TYPE: <span className={
                                        sat.type === 'MIL' ? 'text-red-500' :
                                            sat.type === 'GPS' ? 'text-green-500' :
                                                sat.type === 'COMM' ? 'text-cyan-500' : 'text-yellow-500'
                                    }>{sat.type}</span>
                                </div>
                            </div>
                            {selectedSatellite?.id === sat.id && <div className="w-2 h-2 rounded-full bg-tactical-highlight animate-pulse"></div>}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
