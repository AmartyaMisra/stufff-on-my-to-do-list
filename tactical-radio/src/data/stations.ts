import type { Station } from '../types';

const REAL_STATIONS: Station[] = [
    // --- ASIA ---
    { id: 'as5', name: 'LOVE RADIO SHANGHAI', frequency: 103.7, type: 'MUSIC', coordinates: { lat: 31.2, lng: 121.4 }, region: 'CHN', streamUrl: 'http://lhttp.qingting.fm/live/386/64k.mp3' },
    { id: 'as6', name: 'TBS EFRAME', frequency: 95.1, type: 'NEWS', coordinates: { lat: 37.5, lng: 126.9 }, region: 'KOR', streamUrl: 'http://tbs.hscdn.com/tbsradio/efm/playlist.m3u8' },
    { id: 'as7', name: 'CLASS 95 SINGAPORE', frequency: 95.0, type: 'MUSIC', coordinates: { lat: 1.3, lng: 103.8 }, region: 'SGP', streamUrl: 'https://22383.live.streamtheworld.com/CLASS95_SC' },
    { id: 'as8', name: 'VIRGIN RADIO DUBAI', frequency: 104.4, type: 'MUSIC', coordinates: { lat: 25.2, lng: 55.2 }, region: 'UAE', streamUrl: 'https://ice3.arn.ae/virgin.mp3' },
    { id: 'as9', name: 'METRO FM JAKARTA', frequency: 105.2, type: 'MUSIC', coordinates: { lat: -6.2, lng: 106.8 }, region: 'IDN', streamUrl: 'http://103.16.198.38:8000/stream' },
    { id: 'as10', name: 'COOL 93 BANGKOK', frequency: 93.0, type: 'MUSIC', coordinates: { lat: 13.7, lng: 100.5 }, region: 'THA', streamUrl: 'https://coolism-live.cdn.byteark.com/live/playlist.m3u8' },

    // --- OCEANIA ---
    { id: 'oc1', name: 'TRIPLE J', frequency: 105.7, type: 'MUSIC', coordinates: { lat: -33.8, lng: 151.2 }, region: 'AUS', streamUrl: 'http://live-radio01.mediahubaustralia.com/2TJW/mp3/' },
    { id: 'oc2', name: 'FBI RADIO SYDNEY', frequency: 94.5, type: 'MUSIC', coordinates: { lat: -33.8, lng: 151.2 }, region: 'AUS', streamUrl: 'http://fbiradio.out.airtime.pro:8000/fbiradio_a' },
    { id: 'oc3', name: 'RRR MELBOURNE', frequency: 102.7, type: 'MUSIC', coordinates: { lat: -37.8, lng: 144.9 }, region: 'AUS', streamUrl: 'http://3rrr.streamguys1.com/3rrr-mp3' },
    { id: 'oc4', name: 'GEORGE FM AUCKLAND', frequency: 96.6, type: 'MUSIC', coordinates: { lat: -36.8, lng: 174.7 }, region: 'NZL', streamUrl: 'https://ais-nzme.streamguys1.com/nz_007_aac' },
    { id: 'oc5', name: 'RNZ NATIONAL', frequency: 101.3, type: 'NEWS', coordinates: { lat: -41.2, lng: 174.7 }, region: 'NZL', streamUrl: 'https://ais-nzme.streamguys1.com/nz_001_aac' },

    // --- SOUTH AMERICA ---
    { id: 'sa1', name: 'ELDORADO FM', frequency: 107.3, type: 'MUSIC', coordinates: { lat: -23.5, lng: -46.6 }, region: 'BRA', streamUrl: 'https://audio.eldorado.com.br/eldorado_128k.mp3' },
    { id: 'sa2', name: 'ASPEN 102.3', frequency: 102.3, type: 'MUSIC', coordinates: { lat: -34.6, lng: -58.3 }, region: 'ARG', streamUrl: 'https://26683.live.streamtheworld.com/ASPEN_SC' },
    { id: 'sa3', name: 'RADIOACKTIVA', frequency: 97.9, type: 'MUSIC', coordinates: { lat: 4.7, lng: -74.0 }, region: 'COL', streamUrl: 'https://22563.live.streamtheworld.com/RADIOACKTIVA_SC' },
    { id: 'sa4', name: 'FUTURO FM', frequency: 88.9, type: 'MUSIC', coordinates: { lat: -33.4, lng: -70.6 }, region: 'CHL', streamUrl: 'https://24383.live.streamtheworld.com/FUTUROAAC_SC' },
    { id: 'sa5', name: 'OXIGENO LIMA', frequency: 102.1, type: 'MUSIC', coordinates: { lat: -12.0, lng: -77.0 }, region: 'PER', streamUrl: 'https://20813.live.streamtheworld.com/OXIGENOAAC_SC' },

    // --- AFRICA ---
    { id: 'af1', name: '5FM SOUTH AFRICA', frequency: 98.0, type: 'MUSIC', coordinates: { lat: -26.2, lng: 28.0 }, region: 'ZAF', streamUrl: 'https://edge.iono.fm/xice/5fm_live_medium' },
    { id: 'af2', name: 'KAYA FM', frequency: 95.9, type: 'MUSIC', coordinates: { lat: -26.1, lng: 28.0 }, region: 'ZAF', streamUrl: 'https://edge.iono.fm/xice/kayafm_live_medium' },
    { id: 'af3', name: 'BEAT FM LAGOS', frequency: 99.9, type: 'MUSIC', coordinates: { lat: 6.5, lng: 3.3 }, region: 'NGA', streamUrl: 'http://beatfm.atunwadigital.com/beat' },
    { id: 'af4', name: 'CAPITAL FM KENYA', frequency: 98.4, type: 'MUSIC', coordinates: { lat: -1.2, lng: 36.8 }, region: 'KEN', streamUrl: 'https://icecast.capitalfm.co.ke/capitalfm' },
    { id: 'af5', name: 'NILE FM CAIRO', frequency: 104.2, type: 'MUSIC', coordinates: { lat: 30.0, lng: 31.2 }, region: 'EGY', streamUrl: 'https://secure.nrpstream.com/audio/8002/stream' },
];

// Procedural Generation Logic
const generateStations = (count: number): Station[] => {
    const stations: Station[] = [];
    const regions = [
        { name: 'NA', latMin: 25, latMax: 50, lngMin: -125, lngMax: -70 },
        { name: 'EU', latMin: 35, latMax: 60, lngMin: -10, lngMax: 30 },
        { name: 'AS', latMin: 10, latMax: 50, lngMin: 60, lngMax: 140 },
        { name: 'SA', latMin: -50, latMax: 10, lngMin: -80, lngMax: -35 },
        { name: 'AF', latMin: -35, latMax: 35, lngMin: -15, lngMax: 50 },
        { name: 'OC', latMin: -45, latMax: -10, lngMin: 110, lngMax: 180 },
    ];

    for (let i = 0; i < count; i++) {
        const region = regions[Math.floor(Math.random() * regions.length)];
        const lat = region.latMin + Math.random() * (region.latMax - region.latMin);
        const lng = region.lngMin + Math.random() * (region.lngMax - region.lngMin);

        stations.push({
            id: `gen_${i}`,
            name: `SIG_INT_${Math.floor(Math.random() * 10000)}`,
            frequency: Number((87.5 + Math.random() * 20).toFixed(1)),
            type: Math.random() > 0.5 ? 'MUSIC' : 'NEWS',
            coordinates: { lat, lng },
            region: region.name,
            streamUrl: '' // Dummy URL
        });
    }
    return stations;
};

// Combine real and generated stations
// Reduced procedural stations to make real ones more prominent
export const STATIONS: Station[] = [
    ...REAL_STATIONS,
    ...generateStations(100)  // Only 100 fake ones, so real stations are easier to find
];
