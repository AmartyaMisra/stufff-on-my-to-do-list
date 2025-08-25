export function mapOpenSkyStates(states = []) {
	return states
		.filter(r => r && r.length >= 17 && r[6] != null && r[5] != null)
		.map(r => ({
			icao24: r[0],
			callsign: (r[1] || '').trim() || 'N/A',
			origin_country: r[2],
			time_position: r[3],
			last_contact: r[4],
			longitude: r[5],
			latitude: r[6],
			baro_altitude: r[7],
			on_ground: r[8],
			velocity: r[9],
			true_track: r[10],
			vertical_rate: r[11],
			geo_altitude: r[13],
			squawk: r[14],
			spi: r[15],
			position_source: r[16],
		}));
}
