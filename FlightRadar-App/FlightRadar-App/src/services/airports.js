// Minimal ICAO -> [lat, lon] mapping for common airports
// Note: This is a small seed list. For complete data use an external API/key.
const ICAO_TO_COORDS = {
  // India
  'VIDP': [28.5562, 77.1000], // Delhi
  'VABB': [19.0896, 72.8656], // Mumbai
  'VOBL': [13.1989, 77.7064], // Bengaluru
  'VOMM': [12.9941, 80.1709], // Chennai
  'VECC': [22.6547, 88.4467], // Kolkata
  // Middle East
  'OMDB': [25.2528, 55.3644], // Dubai
  'OTHH': [25.2731, 51.6081], // Doha (Hamad)
  // Europe
  'EGLL': [51.4700, -0.4543], // London Heathrow
  'LFPG': [49.0097, 2.5479], // Paris CDG
  'EDDF': [50.0379, 8.5622], // Frankfurt
  'EHAM': [52.3105, 4.7683], // Amsterdam
  // North America
  'KJFK': [40.6413, -73.7781], // New York JFK
  'KLAX': [33.9416, -118.4085], // Los Angeles LAX
  'KORD': [41.9742, -87.9073], // Chicago O'Hare
  'KATL': [33.6407, -84.4277], // Atlanta
  // Asia
  'RJTT': [35.5494, 139.7798], // Tokyo Haneda
  'RJAA': [35.7767, 140.3186], // Tokyo Narita
  'ZBAA': [40.0801, 116.5846], // Beijing Capital
  'ZSPD': [31.1443, 121.8083], // Shanghai Pudong
  'VHHH': [22.3080, 113.9185], // Hong Kong
  // Oceania
  'YSSY': [ -33.9399, 151.1753], // Sydney
  // Gulf/India extra
  'OPKC': [24.9065, 67.1608], // Karachi
  'OIIE': [35.4161, 51.1522]  // Tehran IKA
};

export function getAirportCoords(input) {
  if (!input) return null;
  // Extract ICAO code if present
  const s = String(input).toUpperCase();
  const m = s.match(/\b[A-Z]{4}\b/);
  const icao = m ? m[0] : null;
  if (icao && ICAO_TO_COORDS[icao]) return ICAO_TO_COORDS[icao];
  return null;
}
