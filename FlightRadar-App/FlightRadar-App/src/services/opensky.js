// Deprecated shim for legacy imports.
// Live fetching now resides in:
// - src/api/opensky.js (OpenSky)
// - src/api/airplaneslive.js (Airplanes.Live)
// and is orchestrated by: src/state/useFlights.js

// This file is kept to avoid breaking older imports. It re-exports the new APIs.

export { fetchOpenSkyOnce, fetchOpenSkyWithBackoff } from '../api/opensky'
