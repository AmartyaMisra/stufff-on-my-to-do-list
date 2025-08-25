import { useEffect, useRef, useState } from 'react';
import { fetchOpenSkyWithBackoff } from '../api/opensky';
import { fetchAirplanesLive } from '../api/airplaneslive';

export function useFlights() {
	const [flights, setFlights] = useState([]);
	const [rawCount, setRawCount] = useState(0);
	const [status, setStatus] = useState({ loading: true, error: null, fetchedAt: null });
	const [intervalMs, setIntervalMs] = useState(15000);
	const [mode, setMode] = useState(localStorage.getItem('mode') || 'world');
	const [provider, setProvider] = useState(localStorage.getItem('provider') || 'opensky'); // 'opensky' | 'airplanes'
	const [bbox, setBbox] = useState(() => {
		const saved = JSON.parse(localStorage.getItem('bbox') || 'null');
		return saved || { minLat: -60, maxLat: 60, minLon: -180, maxLon: 180 };
	});
	const [demoMode, setDemoMode] = useState(() => localStorage.getItem('demo_mode') === '1');
	const timerRef = useRef(null);
	const controllerRef = useRef(null);

	const tick = async () => {
		if (controllerRef.current) controllerRef.current.abort();
		controllerRef.current = new AbortController();
		setStatus(s => ({ ...s, loading: true }));


		let delayMs = intervalMs;
		if (demoMode) {
			// Generate deterministic demo flights inside current bbox
			const generated = generateDemoFlights(bbox, 60);
			setFlights(generated);
			setRawCount(generated.length);
			setStatus({ loading: false, error: null, fetchedAt: new Date() });
			setIntervalMs(intervalMs);
		} else {
			let result;
			if (provider === 'airplanes') {
				result = await fetchAirplanesLive({ mode, bbox, signal: controllerRef.current.signal });
			} else {
				result = await fetchOpenSkyWithBackoff({ minIntervalMs: intervalMs, maxIntervalMs: 45000, controller: controllerRef.current, mode, bbox });
			}
			const { flights: f, rawCount: rc, epoch, error, nextInterval } = result;

			setFlights(f);
			setRawCount(rc);
			setStatus({ loading: false, error: error, fetchedAt: epoch ? new Date(epoch * 1000) : null });
			setIntervalMs(nextInterval);
			delayMs = nextInterval || intervalMs;
		}

		timerRef.current = setTimeout(tick, delayMs);
	};

	useEffect(() => {
		tick();
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			if (controllerRef.current) controllerRef.current.abort();
		};
	// re-fetch when mode/bbox/demo/provider changes
	}, [mode, bbox, demoMode, provider]);

	// expose setters so UI can update
	return { flights, rawCount, status, intervalMs, forceRefresh: tick, setIntervalMs, mode, setMode, bbox, setBbox, demoMode, setDemoMode, provider, setProvider };
}

// --- Demo data generator -----------------------------------------------------
function seededRandom(seed) {
	let x = Math.sin(seed) * 10000;
	return x - Math.floor(x);
}

function generateDemoFlights(bbox, count) {
	const minLat = bbox.minLat, maxLat = bbox.maxLat, minLon = bbox.minLon, maxLon = bbox.maxLon;
	const flights = [];
	const now = Date.now();
	for (let i = 0; i < count; i++) {
		const s = seededRandom(now / 60000 + i);
		const lat = minLat + s * (maxLat - minLat);
		const lon = minLon + seededRandom(i + 42) * (maxLon - minLon);
		const vel = 180 + Math.floor(seededRandom(i + 99) * 220); // m/s
		const hdg = Math.floor(seededRandom(i + 7) * 360);
		const alt = 3000 + Math.floor(seededRandom(i + 3) * 11000);
		flights.push({
			icao24: ('demo' + i.toString(16)).padEnd(6, '0'),
			callsign: 'DEMO' + (100 + i),
			origin_country: 'Demo',
			time_position: Math.floor(now / 1000),
			last_contact: Math.floor(now / 1000),
			longitude: lon,
			latitude: lat,
			baro_altitude: alt,
			on_ground: false,
			velocity: vel,
			true_track: hdg,
			vertical_rate: Math.floor(seededRandom(i + 5) * 10) - 5,
			geo_altitude: alt,
			squawk: null,
			spi: false,
			position_source: 0,
		});
	}
	return flights;
}
