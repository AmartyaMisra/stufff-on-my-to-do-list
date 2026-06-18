import * as satellite from 'satellite.js';

/** Satellite types for visual distinction */
export type SatelliteType = 'COMM' | 'MIL' | 'GPS' | 'WX' | 'UNK';

/** Satellite data structure */
export interface SatelliteData {
    id: string;
    name: string;
    type: SatelliteType;
    tleLine1: string;
    tleLine2: string;
    satrec: satellite.SatRec;
}

/** Geodetic position of a satellite */
export interface SatellitePosition {
    lat: number;
    lng: number;
    alt: number; // km
    velocity: number; // km/s
}

// Primary TLE sources (Celestrak)
const TLE_URLS = [
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=brightest&FORMAT=tle',
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle',
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=noaa&FORMAT=tle',
];

/**
 * Helper to guess satellite type from name
 */
const getSatelliteType = (name: string): SatelliteType => {
    const n = name.toUpperCase();
    if (n.includes('NOAA') || n.includes('METEOR') || n.includes('GOES')) return 'WX';
    if (n.includes('GPS') || n.includes('NAVSTAR') || n.includes('GLONASS') || n.includes('GALILEO')) return 'GPS';
    if (n.includes('STARLINK') || n.includes('ONEWEB') || n.includes('IRIDIUM')) return 'COMM';
    if (n.includes('USA') || n.includes('COSMOS') || n.includes('VANDENBERG')) return 'MIL';
    return 'UNK';
};

/**
 * Fallback TLE data – a massive set of dummy satellites for a busy tactical display.
 * We generate 200 dummy entries programmatically plus real examples.
 */
const FALLBACK_TLES: Omit<SatelliteData, 'satrec'>[] = [
    // Real examples
    { id: '25544', name: 'ISS (ZARYA)', type: 'COMM', tleLine1: '1 25544U 98067A   23324.54791667  .00012345  00000-0  23456-3 0  9993', tleLine2: '2 25544  51.6444 207.4444 0005555 100.3333 200.4444 15.49999999999999' },
    { id: '20580', name: 'HST', type: 'UNK', tleLine1: '1 20580U 90037B   23324.44444444  .00001111  00000-0  11111-3 0  9991', tleLine2: '2 20580  28.4699 300.1111 0002222 150.5555 300.6666 15.09999999999999' },
    // ...Programmatically generated below
];

// Generate 500 dummy satellites with varied orbits
for (let i = 0; i < 500; i++) {
    const id = (90000 + i).toString();
    const type: SatelliteType = ['COMM', 'MIL', 'GPS', 'WX'][Math.floor(Math.random() * 4)] as SatelliteType;
    const name = `TAC-${type}-${(i + 1).toString().padStart(3, '0')}`;

    // Random orbital parameters
    const inc = (Math.random() * 180).toFixed(4); // Inclination
    const raan = (Math.random() * 360).toFixed(4); // Right Ascension of Ascending Node
    const ecc = '0010000'; // Eccentricity (keep circular-ish)
    const argP = (Math.random() * 360).toFixed(4); // Argument of Perigee
    const meanAnom = (Math.random() * 360).toFixed(4); // Mean Anomaly
    const meanMotion = (12 + Math.random() * 4).toFixed(8); // Revs per day (Low Earth Orbit)

    FALLBACK_TLES.push({
        id,
        name,
        type,
        tleLine1: `1 ${id}U 23001A   23324.11111111  .00000000  00000-0  00000-0 0  999${i % 9}`,
        tleLine2: `2 ${id}  ${inc} ${raan} ${ecc} ${argP} ${meanAnom} ${meanMotion}000000`
    });
}

/**
 * Fetch satellite TLE data from the Celestrak URLs.
 */
export const fetchSatellites = async (): Promise<SatelliteData[]> => {
    const satellites: SatelliteData[] = [];
    const seenIds = new Set<string>();

    const addSat = (name: string, line1: string, line2: string, forceType?: SatelliteType) => {
        if (line1 && line2 && line1.startsWith('1') && line2.startsWith('2')) {
            const id = line2.substring(2, 7).trim();
            if (!seenIds.has(id)) {
                seenIds.add(id);
                try {
                    const satrec = satellite.twoline2satrec(line1, line2);
                    const type = forceType || getSatelliteType(name);
                    satellites.push({ id, name, type, tleLine1: line1, tleLine2: line2, satrec });
                } catch (e) {
                    console.warn(`Failed to parse satellite ${name}`, e);
                }
            }
        }
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        for (const url of TLE_URLS) {
            try {
                const response = await fetch(url, { signal: controller.signal });
                if (!response.ok) continue;
                const text = await response.text();
                const lines = text.split('\n');
                for (let i = 0; i < lines.length; i += 3) {
                    const name = lines[i]?.trim();
                    const line1 = lines[i + 1]?.trim();
                    const line2 = lines[i + 2]?.trim();
                    if (name && line1 && line2) addSat(name, line1, line2);
                }
            } catch (err) {
                console.warn(`Failed to fetch from ${url}`, err);
            }
        }
        clearTimeout(timeoutId);
    } catch (error) {
        console.error('Failed to fetch satellite data:', error);
    }

    // Use fallback if we have fewer than 20 satellites (fetching likely failed)
    if (satellites.length < 20) {
        console.log('Using fallback satellite data (Tactical Simulation Mode)');
        FALLBACK_TLES.forEach(sat => addSat(sat.name, sat.tleLine1, sat.tleLine2, sat.type));
    }

    return satellites;
};

/** Compute the current geodetic position and velocity of a satellite. */
export const getSatellitePosition = (
    sat: SatelliteData,
    date: Date = new Date()
): SatellitePosition | null => {
    const positionAndVelocity = satellite.propagate(sat.satrec, date);
    if (!positionAndVelocity || !positionAndVelocity.position || !positionAndVelocity.velocity) return null;

    const positionGd = satellite.eciToGeodetic(
        positionAndVelocity.position as satellite.EciVec3<number>,
        satellite.gstime(date)
    );

    if (isNaN(positionGd.latitude) || isNaN(positionGd.longitude)) return null;

    const lat = satellite.degreesLat(positionGd.latitude);
    const lng = satellite.degreesLong(positionGd.longitude);
    const alt = positionGd.height;

    // Calculate velocity magnitude (km/s)
    const v = positionAndVelocity.velocity as satellite.EciVec3<number>;
    const velocity = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);

    return { lat, lng, alt, velocity };
};
