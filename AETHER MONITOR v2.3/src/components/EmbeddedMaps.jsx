import React, { useState, useEffect, useRef } from 'react';
import { Plane, Shield, Radio, ExternalLink, Volume2, AlertTriangle, MapPin, Clock, Users, CloudRain, Activity } from 'lucide-react';

// ============================================
// FLIGHT TRACKER - ADS-B EXCHANGE EMBED
// Real flight data via iframe (allows embedding)
// ============================================
export const FlightRadarEmbed = () => {
    const [region, setRegion] = useState('global');

    // ADS-B Exchange allows embedding - real flight data
    const regions = {
        global: { name: 'GLOBAL', url: 'https://globe.adsbexchange.com/?hideSidebar&hideButtons&zoom=2&lat=30&lon=0' },
        northamerica: { name: 'N. AMERICA', url: 'https://globe.adsbexchange.com/?hideSidebar&hideButtons&zoom=4&lat=40&lon=-100' },
        europe: { name: 'EUROPE', url: 'https://globe.adsbexchange.com/?hideSidebar&hideButtons&zoom=4&lat=50&lon=10' },
        asia: { name: 'ASIA', url: 'https://globe.adsbexchange.com/?hideSidebar&hideButtons&zoom=4&lat=30&lon=100' },
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-950">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-amber-900/80 to-slate-900/80 border-b border-amber-500/30 z-20">
                <div className="flex items-center gap-3">
                    <Plane className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400 tracking-wider">LIVE FLIGHT TRACKER</span>
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded border border-green-500/30 animate-pulse">
                        ADS-B EXCHANGE
                    </span>
                </div>
                <div className="flex gap-1">
                    {Object.entries(regions).map(([key, val]) => (
                        <button
                            key={key}
                            onClick={() => setRegion(key)}
                            className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${region === key
                                ? 'bg-amber-500 text-black'
                                : 'bg-amber-900/40 text-amber-400 hover:bg-amber-800/60'
                                }`}
                        >
                            {val.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* ADS-B Exchange Embed */}
            <div className="flex-1 relative">
                <iframe
                    key={region}
                    src={regions[region].url}
                    className="w-full h-full border-0"
                    style={{ filter: 'saturate(0.9) brightness(0.95)' }}
                    title="ADS-B Exchange Live"
                    allow="fullscreen"
                    sandbox="allow-scripts allow-same-origin"
                />
                <div className="absolute bottom-2 right-2 text-[8px] text-slate-500 bg-black/70 px-2 py-1 rounded">
                    SOURCE: ADS-B EXCHANGE
                </div>
            </div>
        </div>
    );
};

// ============================================
// INCIDENT INTEL STREAM - SIGINT CONSOLE
// Military-style real-time incident feed
// ============================================
export const CrimeMapEmbed = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const feedRef = useRef(null);
    const [flashingIds, setFlashingIds] = useState(new Set());

    // Incident type icons and colors
    const typeConfig = {
        'FIRE': { icon: '🔥', color: '#ff6b35', label: 'FIRE' },
        'POLICE': { icon: '🚓', color: '#3b82f6', label: 'POLICE' },
        'EMS': { icon: '🚑', color: '#22c55e', label: 'EMS' },
        'EARTHQUAKE': { icon: '🌋', color: '#eab308', label: 'SEISMIC' },
        'WEATHER': { icon: '🌪️', color: '#8b5cf6', label: 'WEATHER' },
        'HAZMAT': { icon: '☢️', color: '#f97316', label: 'HAZMAT' },
        'MILITARY': { icon: '🎖️', color: '#dc2626', label: 'MILITARY' },
        'CIVILIAN': { icon: '📢', color: '#06b6d4', label: 'CIVILIAN' },
        'NATURAL': { icon: '🌍', color: '#10b981', label: 'NATURAL' },
        'UNKNOWN': { icon: '🛰️', color: '#64748b', label: 'UNKNOWN' }
    };

    const getTypeFromIncident = (inc) => {
        const type = (inc.type || inc.category || '').toUpperCase();
        if (type.includes('FIRE') || type.includes('BLAZE')) return 'FIRE';
        if (type.includes('POLICE') || type.includes('CRIME') || type.includes('ASSAULT') || type.includes('ROBBERY')) return 'POLICE';
        if (type.includes('EMS') || type.includes('MEDICAL') || type.includes('AMBULANCE')) return 'EMS';
        if (type.includes('EARTHQUAKE') || type.includes('SEISMIC')) return 'EARTHQUAKE';
        if (type.includes('WEATHER') || type.includes('STORM') || type.includes('FLOOD') || type.includes('TYPHOON')) return 'WEATHER';
        if (type.includes('HAZMAT') || type.includes('CHEMICAL') || type.includes('TOXIC')) return 'HAZMAT';
        if (type.includes('MILITARY') || type.includes('ARTILLERY') || type.includes('COMBAT')) return 'MILITARY';
        if (type.includes('NATURAL') || type.includes('VOLCANIC')) return 'NATURAL';
        if (type.includes('311') || type.includes('NOISE') || type.includes('COMPLAINT')) return 'CIVILIAN';
        return 'UNKNOWN';
    };

    const formatTime = (timestamp) => {
        try {
            const d = new Date(timestamp);
            return d.toISOString().substring(11, 19) + ' UTC';
        } catch {
            return new Date().toISOString().substring(11, 19) + ' UTC';
        }
    };

    const getLocation = (inc) => {
        if (inc.city) return inc.city.toUpperCase().substring(0, 20);
        if (inc.source === 'Chicago PD') return 'CHICAGO, USA';
        if (inc.source === 'NYC 311') return 'NEW YORK, USA';
        if (inc.source === 'USGS') return 'SEISMIC ZONE';
        if (inc.source === 'GDACS') return 'GLOBAL';
        return 'UNKNOWN SECTOR';
    };

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/incidents');
                const response = await res.json();
                const data = response.data || response || [];

                // Sort by time (newest first) and limit to 150
                const sorted = data
                    .filter(i => i.lat && i.lon)
                    .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
                    .slice(0, 150);

                // Mark new HIGH severity as flashing
                const newFlashing = new Set();
                sorted.forEach(inc => {
                    if (inc.severity === 'HIGH' && !incidents.find(i => i.id === inc.id)) {
                        newFlashing.add(inc.id);
                    }
                });

                if (newFlashing.size > 0) {
                    setFlashingIds(prev => new Set([...prev, ...newFlashing]));
                    setTimeout(() => {
                        setFlashingIds(prev => {
                            const next = new Set(prev);
                            newFlashing.forEach(id => next.delete(id));
                            return next;
                        });
                    }, 10000);
                }

                setIncidents(sorted);
                setLoading(false);
            } catch (err) {
                console.error('[INTEL] Fetch error:', err);
                setLoading(false);
            }
        };

        fetchIncidents();
        const interval = setInterval(fetchIncidents, 20000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full bg-black flex flex-col" style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}>
            {/* Header - Military Style */}
            <div className="flex items-center justify-between px-4 py-2 bg-black border-b border-red-900/50">
                <div className="flex items-center gap-4">
                    <span className="text-red-500 font-bold text-sm tracking-widest">◉ INCIDENT INTEL STREAM</span>
                    <span className="text-green-500 text-xs animate-pulse">● LIVE FEED</span>
                    <span className="text-slate-500 text-xs">{incidents.length} EVENTS</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <span className="text-green-600">USGS</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-red-600">OSINT</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-orange-600">CENTCOM</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-purple-600">ACLED</span>
                </div>
            </div>

            {/* Feed Container */}
            <div
                ref={feedRef}
                className="flex-1 overflow-y-auto p-2 space-y-0.5"
                style={{ backgroundColor: '#050505' }}
            >
                {loading ? (
                    <div className="text-green-500 text-center py-8 animate-pulse text-sm">
                        ▓▓▓ INITIALIZING INTEL FEED ▓▓▓
                    </div>
                ) : incidents.length === 0 ? (
                    <div className="text-slate-600 text-center py-8 text-sm">
                        [ NO ACTIVE INCIDENTS IN BUFFER ]
                    </div>
                ) : (
                    incidents.map((inc, idx) => {
                        const typeKey = getTypeFromIncident(inc);
                        const config = typeConfig[typeKey];
                        const isFlashing = flashingIds.has(inc.id);
                        const isCritical = inc.severity === 'HIGH';

                        return (
                            <div
                                key={inc.id || idx}
                                className={`flex items-center gap-2 px-2 py-1 text-xs border-l-2 ${isFlashing ? 'animate-pulse bg-red-950/40' : ''
                                    } ${isCritical ? 'border-red-500' : 'border-slate-800/50'}`}
                            >
                                <span className="text-slate-600 w-[85px] flex-shrink-0">[{formatTime(inc.time)}]</span>
                                <span
                                    className="px-1 py-0.5 rounded text-[9px] font-bold w-[70px] text-center flex-shrink-0"
                                    style={{ backgroundColor: config.color + '20', color: config.color }}
                                >
                                    {config.icon} {config.label}
                                </span>
                                <span className="text-cyan-500 w-[130px] flex-shrink-0 truncate font-bold">{getLocation(inc)}</span>
                                <span className="text-slate-700">|</span>
                                <span className={`flex-1 truncate ${isCritical ? 'text-red-400' : 'text-slate-400'}`}>
                                    "{inc.description || inc.type || 'Incident reported'}"
                                </span>
                                <span className="text-slate-700 text-[9px] w-[55px] text-right flex-shrink-0">[{inc.source || 'INTEL'}]</span>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-1 bg-black border-t border-slate-800/50 text-[9px] text-slate-600">
                <span>REFRESH: 20s AUTO</span>
                <span>CLASSIFICATION: UNCLASSIFIED // FOUO</span>
                <span>AETHER-SIGINT v2.3</span>
            </div>
        </div>
    );
};

// ============================================
// HAM RADIO PANEL - Scrollable with Working ATC
// ============================================
export const HamRadioPanel = ({ mode, onSelectStream }) => {
    const streams = mode === 'ATS' ? [
        // REAL LiveATC Streams (These are actual ATC audio feeds)
        { id: 'atc1', name: 'LAX Tower', freq: '133.900 MHz', type: 'ATS', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/klax_twr') },
        { id: 'atc2', name: 'JFK Approach', freq: '127.400 MHz', type: 'ATS', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/kjfk_app') },
        { id: 'atc3', name: "Chicago O'Hare", freq: '120.750 MHz', type: 'ATS', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/kord_twr') },
        { id: 'atc4', name: 'Atlanta Ground', freq: '121.900 MHz', type: 'ATS', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/katl_gnd') },
        { id: 'atc5', name: 'London Heathrow', freq: '118.500 MHz', type: 'ATS', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/egll_twr') },
        { id: 'atc6', name: 'Tokyo Narita', freq: '118.200 MHz', type: 'ATS', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/rjaa_twr') },
        { id: 'atc7', name: 'Sydney Tower', freq: '120.500 MHz', type: 'ATS', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/yssy_twr') },
        { id: 'atc8', name: 'Dubai Approach', freq: '124.900 MHz', type: 'ATS', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/omdb_app') },
        { id: 'atc9', name: 'Dallas Tower', freq: '126.550 MHz', type: 'ATS', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/kdfw_twr') },
        { id: 'atc10', name: 'Denver Approach', freq: '120.800 MHz', type: 'ATS', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://s1-fmt2.liveatc.net/kden_app') },
    ] : mode === 'WEATHER' ? [
        // REAL NOAA Weather Radio via weatherusa.net (Same as NODES.WEATHER)
        { id: 'wx1', name: 'NOAA Boston', freq: '162.475 MHz', type: 'WX', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/WXL58.mp3') },
        { id: 'wx2', name: 'NOAA Miami', freq: '162.550 MHz', type: 'WX', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KEC61_2.mp3') },
        { id: 'wx3', name: 'NOAA Los Angeles', freq: '162.400 MHz', type: 'WX', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KWO37.mp3') },
        { id: 'wx4', name: 'NOAA Seattle', freq: '162.550 MHz', type: 'WX', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KIG77.mp3') },
        { id: 'wx5', name: 'NOAA Denver', freq: '162.475 MHz', type: 'WX', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KHB33.mp3') },
        { id: 'wx6', name: 'NOAA Houston', freq: '162.400 MHz', type: 'WX', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/WXK91.mp3') },
        { id: 'wx7', name: 'NOAA Atlanta', freq: '162.550 MHz', type: 'WX', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KEC57.mp3') },
        { id: 'wx8', name: 'NOAA Phoenix', freq: '162.400 MHz', type: 'WX', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KJY96.mp3') },
        { id: 'wx9', name: 'NOAA Dallas', freq: '162.475 MHz', type: 'WX', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/WXL53.mp3') },
        { id: 'wx10', name: 'NOAA San Francisco', freq: '162.400 MHz', type: 'WX', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://radio.weatherusa.net/NWR/KWO35.mp3') },
    ] : [
        // REAL Police/Fire Scanner Feeds via Broadcastify
        { id: 'tac1', name: 'Chicago Fire/EMS', freq: '460.500 MHz', type: 'TACTICAL', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/26451') },
        { id: 'tac2', name: 'NYPD Citywide', freq: '476.300 MHz', type: 'TACTICAL', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/32480') },
        { id: 'tac3', name: 'LAPD Dispatch', freq: '460.025 MHz', type: 'TACTICAL', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/20296') },
        { id: 'tac4', name: 'FDNY Manhattan', freq: '154.430 MHz', type: 'TACTICAL', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/9358') },
        { id: 'tac5', name: 'Houston Police', freq: '460.100 MHz', type: 'TACTICAL', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/14439') },
        { id: 'tac6', name: 'Miami-Dade PD', freq: '460.175 MHz', type: 'TACTICAL', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/4334') },
        { id: 'tac7', name: 'Dallas Police', freq: '460.025 MHz', type: 'TACTICAL', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/18040') },
        { id: 'tac8', name: 'Detroit Police', freq: '460.150 MHz', type: 'TACTICAL', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/19892') },
        { id: 'tac9', name: 'Phoenix Fire', freq: '154.340 MHz', type: 'TACTICAL', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/4364') },
        { id: 'tac10', name: 'Las Vegas Metro PD', freq: '460.200 MHz', type: 'TACTICAL', url: 'http://localhost:3001/proxy/stream?url=' + encodeURIComponent('https://broadcastify.cdnstream1.com/12972') },
    ];

    return (
        <div className="h-full overflow-y-auto p-2 space-y-1 bg-slate-900/50">
            <div className="text-[10px] text-slate-500 mb-2 font-bold tracking-wider">
                {mode === 'ATS' ? '📡 ATC FEEDS' : mode === 'WEATHER' ? '🌪️ NOAA WX RADIO' : '🔊 SCANNER FEEDS'}
            </div>
            {streams.map(s => (
                <button
                    key={s.id}
                    onClick={() => onSelectStream && onSelectStream(s)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-slate-800/60 hover:bg-slate-700/80 transition-all text-left group"
                >
                    <Radio className="w-3 h-3 text-green-500 group-hover:animate-pulse" />
                    <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-300 truncate">{s.name}</div>
                        <div className="text-[9px] text-slate-500">{s.freq}</div>
                    </div>
                    <Volume2 className="w-3 h-3 text-slate-600 group-hover:text-green-400" />
                </button>
            ))}
        </div>
    );
};

// ============================================
// WEATHER MAP EMBED - Windy.com (Reliable)
// ============================================
export const WeatherMapEmbed = ({ lat = 40.7128, lon = -74.0060, zoom = 5 }) => {
    return (
        <div className="w-full h-full relative">
            <iframe
                src={`https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=${zoom}&level=surface&overlay=rain&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&detailLat=${lat}&detailLon=${lon}&metricWind=default&metricTemp=default&radarRange=-1`}
                className="w-full h-full border-0"
                title="Windy Weather Map"
                allowFullScreen
            />
            <div className="absolute bottom-2 right-2 text-[8px] text-slate-500 bg-black/70 px-2 py-1 rounded">
                SOURCE: WINDY.COM
            </div>
        </div>
    );
};

export default { FlightRadarEmbed, CrimeMapEmbed, HamRadioPanel, WeatherMapEmbed };
