import { Station } from '../types';
import { VERIFIED_STATIONS } from './verifiedStations';

// Procedural generation of stations
const generateStations = (count: number): Station[] => {
    const stations: Station[] = [];

    // Add verified stations first
    stations.push(...VERIFIED_STATIONS);

    const types: ('NEWS' | 'MUSIC')[] = ['NEWS', 'MUSIC'];
    const regions = ['NORTH_AMERICA', 'SOUTH_AMERICA', 'EUROPE', 'ASIA', 'AFRICA', 'OCEANIA'];

    for (let i = 0; i < count; i++) {
        const isNews = Math.random() > 0.7; // 30% News, 70% Music

        // Random coordinates (approximate land masses roughly, or just random for now)
        const lat = (Math.random() * 160) - 80; // Avoid extreme poles
        const lng = (Math.random() * 360) - 180;

        stations.push({
            id: `proc-${i}`,
            name: `SIGINT-${Math.floor(Math.random() * 9000) + 1000}`,
            frequency: parseFloat((87.5 + Math.random() * 20).toFixed(1)),
            type: isNews ? 'NEWS' : 'MUSIC',
            coordinates: { lat, lng },
            region: regions[Math.floor(Math.random() * regions.length)],
            streamUrl: '' // No stream for procedural stations
        });
    }

    return stations;
};

export const ALL_STATIONS = generateStations(1500);
