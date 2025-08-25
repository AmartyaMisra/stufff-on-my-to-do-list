import { mapOpenSkyStates } from './normalize';

// Base endpoint
const OPEN_SKY_BASE = 'https://opensky-network.org/api/states/all';

function buildUrl({ mode = 'world', bbox } = {}) {
  if (mode === 'viewport' || mode === 'custom') {
    const p = new globalThis.URL(OPEN_SKY_BASE);
    if (bbox) {
      p.searchParams.set('lamin', String(bbox.minLat));
      p.searchParams.set('lomin', String(bbox.minLon));
      p.searchParams.set('lamax', String(bbox.maxLat));
      p.searchParams.set('lomax', String(bbox.maxLon));
    }
    return p.toString();
  }
  return OPEN_SKY_BASE;
}
let lastStatus = { ok: true, reason: '', ts: 0 };

export async function fetchOpenSkyOnce(signal, { mode = 'world', bbox } = {}) {
  const url = buildUrl({ mode, bbox });
  // Optional basic auth from localStorage for higher rate limits
  let headers = undefined;
  try {
    const creds = JSON.parse(localStorage.getItem('openskyCreds') || 'null');
    if (creds?.username && creds?.password && typeof btoa === 'function') {
      headers = { Authorization: 'Basic ' + btoa(`${creds.username}:${creds.password}`) };
    }
  } catch {}

	const res = await fetch(url, { signal, headers });
	if (!res.ok) throw new Error(`OpenSky HTTP ${res.status}`);
	const data = await res.json();
	const mapped = mapOpenSkyStates(data?.states || []);
	return { mapped, rawCount: data?.states?.length || 0, time: data?.time || Math.floor(Date.now() / 1000) };
}

export async function fetchOpenSkyWithBackoff({ minIntervalMs = 15000, maxIntervalMs = 45000, controller, mode = 'world', bbox } = {}) {
	try {
		const { mapped, rawCount, time } = await fetchOpenSkyOnce(controller?.signal, { mode, bbox });
		lastStatus = { ok: true, reason: '', ts: Date.now() };
		const next = rawCount < 50 ? Math.min(maxIntervalMs, minIntervalMs * 2) : minIntervalMs;
		return { flights: mapped, rawCount, epoch: time, error: null, nextInterval: next };
	} catch (e) {
		const msg = `${e?.message || e}`;
		lastStatus = { ok: false, reason: msg, ts: Date.now() };
		return { flights: [], rawCount: 0, epoch: null, error: msg, nextInterval: maxIntervalMs };
	}
}

export function getLastStatus() { return lastStatus; }
