import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, ExternalLink, Play, Pause, Radio, AlertCircle, Loader2, Tag } from 'lucide-react';
import { FEEDS, FEED_BADGES, FEED_CATEGORIES, extractYouTubeID } from './feeds';

// ============================================
// FEED BADGE COMPONENT
// ============================================
export function FeedBadge({ type }) {
    const badge = FEED_BADGES[type];
    if (!badge) return null;
    return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${badge.className}`}>
            {badge.label}
        </span>
    );
}

// ============================================
// CATEGORY BADGE
// ============================================
export function CategoryBadge({ category }) {
    const colors = {
        ATC: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        POLICE: 'bg-red-500/20 text-red-300 border-red-500/30',
        MILITARY: 'bg-green-500/20 text-green-300 border-green-500/30',
        SCANNER: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        HAM: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        WEATHER: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    };
    return (
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono border ${colors[category] || 'bg-slate-500/20'}`}>
            {category}
        </span>
    );
}

// ============================================
// YOUTUBE EMBEDDED PLAYER
// ============================================
function YouTubePlayer({ videoId, autoplay = true }) {
    if (!videoId) {
        return (
            <div className="aspect-video bg-slate-900 flex items-center justify-center text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                Invalid YouTube URL
            </div>
        );
    }

    return (
        <div className="aspect-video w-full rounded overflow-hidden bg-black border border-red-500/30">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&mute=0`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube Live Stream"
            />
        </div>
    );
}

// ============================================
// AUDIO PLAYER COMPONENT
// ============================================
function AudioPlayer({ src, onError, autoplay = true }) {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setError(null);
        setIsLoading(true);
        setIsPlaying(false);

        if (audioRef.current) {
            audioRef.current.src = src;
            audioRef.current.load();
        }
    }, [src]);

    const handleCanPlay = () => {
        setIsLoading(false);
        if (autoplay && audioRef.current) {
            audioRef.current.play().catch(err => {
                console.error('Autoplay blocked:', err);
            });
        }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e) => {
        setIsLoading(false);
        setError('Stream unavailable or offline');
        onError?.('Stream error');
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => setError(err.message));
        }
    };

    if (error) {
        return (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 p-3 rounded bg-slate-800/50 border border-slate-700">
            <button
                onClick={togglePlay}
                disabled={isLoading}
                className={`p-3 rounded-full transition-all flex-shrink-0 ${isLoading ? 'bg-slate-700 text-slate-500' :
                        isPlaying
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                    }`}
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                    <Pause className="w-5 h-5" />
                ) : (
                    <Play className="w-5 h-5" />
                )}
            </button>
            <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-400 mb-1 truncate">
                    {isLoading ? '⏳ Connecting...' : isPlaying ? '▶ Streaming' : '⏸ Paused'}
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded overflow-hidden">
                    {isPlaying && (
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 animate-pulse" style={{ width: '100%' }} />
                    )}
                </div>
            </div>
            <audio
                ref={audioRef}
                onCanPlay={handleCanPlay}
                onPlay={handlePlay}
                onPause={handlePause}
                onError={handleError}
                preload="none"
            />
        </div>
    );
}

// ============================================
// FEED PLAYER COMPONENT
// ============================================
export function FeedPlayer({ feed, onClose }) {
    const [error, setError] = useState(null);

    if (!feed) return null;

    // EXTERNAL feeds - show link button
    if (feed.type === 'EXTERNAL') {
        return (
            <div className="flex flex-col gap-3 p-4 rounded-lg bg-slate-900/90 border border-orange-500/30">
                <div className="flex items-center gap-2">
                    <FeedBadge type={feed.type} />
                    <CategoryBadge category={feed.category} />
                </div>
                <h3 className="text-white font-bold text-lg">{feed.label}</h3>
                <p className="text-slate-400 text-sm">{feed.description}</p>
                <button
                    onClick={() => window.open(feed.externalUrl, '_blank')}
                    className="w-full p-3 rounded bg-orange-500 hover:bg-orange-400 text-black font-bold flex items-center justify-center gap-2 transition-all"
                >
                    <ExternalLink className="w-4 h-4" />
                    OPEN IN BROWSER
                </button>
                <p className="text-slate-500 text-[10px] text-center">
                    ⚠️ Protected service - cannot play in-app
                </p>
            </div>
        );
    }

    // YOUTUBE feeds - embedded player
    if (feed.type === 'YOUTUBE') {
        const videoId = feed.youtubeId || extractYouTubeID(feed.url);
        return (
            <div className="flex flex-col gap-3 p-4 rounded-lg bg-slate-900/90 border border-red-500/30">
                <div className="flex items-center gap-2">
                    <FeedBadge type={feed.type} />
                    <CategoryBadge category={feed.category} />
                    <span className="text-red-400 text-[10px] animate-pulse">● LIVE</span>
                </div>
                <h3 className="text-white font-bold">{feed.label}</h3>
                <YouTubePlayer videoId={videoId} autoplay={true} />
                <p className="text-slate-500 text-xs">{feed.description}</p>
                <div className="flex flex-wrap gap-1">
                    {feed.tags?.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 border border-slate-700">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    // LIVE, REC, SIM feeds - audio player
    return (
        <div className={`flex flex-col gap-3 p-4 rounded-lg bg-slate-900/90 border ${feed.type === 'LIVE' ? 'border-green-500/30' :
                feed.type === 'REC' ? 'border-blue-500/30' :
                    'border-purple-500/30'
            }`}>
            <div className="flex items-center gap-2 flex-wrap">
                <FeedBadge type={feed.type} />
                <CategoryBadge category={feed.category} />
                <span className="text-slate-500 text-[10px] font-mono">{feed.source}</span>
            </div>
            <h3 className="text-white font-bold">{feed.label}</h3>
            <p className="text-slate-400 text-sm">{feed.description}</p>

            <AudioPlayer
                src={feed.url}
                onError={setError}
                autoplay={true}
            />

            {feed.type === 'SIM' && (
                <p className="text-purple-400 text-[10px] text-center italic">
                    ⚠️ Simulated audio - not real ATC/scanner
                </p>
            )}

            <div className="flex flex-wrap gap-1">
                {feed.tags?.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 border border-slate-700">
                        #{tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ============================================
// FEED LIST ITEM
// ============================================
export function FeedListItem({ feed, isSelected, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-2 rounded text-left transition-all ${isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/50 border'
                    : 'bg-slate-800/30 border-transparent border hover:bg-slate-700/30 hover:border-slate-600'
                }`}
        >
            <div className="flex items-center gap-2 mb-1">
                <FeedBadge type={feed.type} />
                <CategoryBadge category={feed.category} />
            </div>
            <div className="text-white text-sm font-medium truncate">{feed.label}</div>
            <div className="text-slate-500 text-[10px] truncate">{feed.description}</div>
        </button>
    );
}

// ============================================
// FEED LIST COMPONENT (Full Panel)
// ============================================
export function FeedList({ feeds = FEEDS, onSelectFeed, selectedFeedId, filter }) {
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [typeFilter, setTypeFilter] = useState(null);

    // Apply filters
    let displayFeeds = feeds;
    if (categoryFilter) {
        displayFeeds = displayFeeds.filter(f => f.category === categoryFilter);
    }
    if (typeFilter) {
        displayFeeds = displayFeeds.filter(f => f.type === typeFilter);
    }
    if (filter) {
        displayFeeds = displayFeeds.filter(f => filter(f));
    }

    // Group by category
    const grouped = displayFeeds.reduce((acc, feed) => {
        if (!acc[feed.category]) acc[feed.category] = [];
        acc[feed.category].push(feed);
        return acc;
    }, {});

    return (
        <div className="flex flex-col gap-2 h-full overflow-hidden">
            {/* Filter buttons */}
            <div className="flex gap-1 flex-wrap pb-2 border-b border-slate-800">
                <button
                    onClick={() => setTypeFilter(null)}
                    className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${!typeFilter ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                >
                    ALL
                </button>
                {Object.keys(FEED_BADGES).map(type => (
                    <button
                        key={type}
                        onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                        className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${typeFilter === type ? FEED_BADGES[type].className : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Feed list */}
            <div className="flex-1 overflow-y-auto space-y-3">
                {Object.entries(grouped).map(([category, categoryFeeds]) => (
                    <div key={category}>
                        <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1">
                            <Radio className="w-3 h-3" />
                            {FEED_CATEGORIES[category] || category}
                        </div>
                        <div className="space-y-1">
                            {categoryFeeds.map(feed => (
                                <FeedListItem
                                    key={feed.id}
                                    feed={feed}
                                    isSelected={selectedFeedId === feed.id}
                                    onClick={() => onSelectFeed(feed)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// COMPACT FEED SELECTOR (for sidebar)
// ============================================
export function CompactFeedSelector({ feeds = FEEDS, onSelectFeed, selectedFeedId }) {
    return (
        <div className="space-y-1 max-h-60 overflow-y-auto">
            {feeds.slice(0, 10).map(feed => (
                <button
                    key={feed.id}
                    onClick={() => onSelectFeed(feed)}
                    className={`w-full p-2 rounded text-left text-xs transition-all flex items-center gap-2 ${selectedFeedId === feed.id
                            ? 'bg-cyan-500/20 border-cyan-500/50 border text-white'
                            : 'bg-slate-800/50 border-transparent border text-slate-300 hover:bg-slate-700/50'
                        }`}
                >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${feed.type === 'LIVE' || feed.type === 'YOUTUBE' ? 'bg-red-500 animate-pulse' :
                            feed.type === 'REC' ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                    <span className="truncate">{feed.label}</span>
                </button>
            ))}
        </div>
    );
}

export default FeedPlayer;
