import type { Station } from '../types';

const API_BASE = 'https://de1.api.radio-browser.info/json/stations/search';

export async function fetchStations(limit: number = 500): Promise<Station[]> {
    try {
        // Fetch top voted stations that have geo-coordinates
        // We filter for stations with 'geo_lat' to ensure map accuracy
        const response = await fetch(`${API_BASE}?limit=${limit}&order=votes&reverse=true&hidebroken=true&has_geo_info=true`);
        const data = await response.json();

        return data.map((item: any) => ({
            id: item.stationuuid,
            name: item.name.trim().toUpperCase(),
            frequency: parseFloat(item.freq) || 0,
            type: (item.tags.includes('news') || item.tags.includes('talk')) ? 'NEWS' : 'MUSIC',
            coordinates: {
                lat: parseFloat(item.geo_lat),
                lng: parseFloat(item.geo_long)
            },
            region: (item.country || item.countrycode || 'UNK').toUpperCase(),
            streamUrl: item.url_resolved || item.url
        }));
    } catch (error) {
        console.error("Failed to fetch from Radio Browser:", error);
        return [];
    }
}
