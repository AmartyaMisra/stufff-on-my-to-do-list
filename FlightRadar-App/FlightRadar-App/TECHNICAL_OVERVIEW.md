# FlightRadar-App – Deep Dive (Architecture, Data, and Aviation Concepts)

This document explains how the app is designed and why specific choices were made. It covers: architecture, data flow, performance strategies, code links, security considerations, and a primer on aviation data used in the UI.

---

## 1) High-Level Architecture

- Desktop shell: Electron (main process) launches a `BrowserWindow` and loads the built Vite+React app.
- Renderer app: React (SPA) with Leaflet for the map; components render a map, settings, flight sidebar, and Live ATC panel.
- Data layer: `src/api/opensky.js` (OpenSky) and `src/api/airplaneslive.js` (Airplanes.Live) return normalized flight objects; `src/state/useFlights.js` manages polling, provider selection, and demo mode.
- Preload: `preload.cjs` exposes minimal info (platform + versions) safely under `contextIsolation: true`.
- Packaging: Vite bundles frontend; Electron Builder produces installers.

Key files:
- Electron entry: `main.js`
- Preload: `preload.cjs`
- React entry: `src/App.jsx`
- Map: `src/components/Map.jsx`
- Settings: `src/components/Settings.jsx`
- Right sidebar (flights, details, route, chat, Live ATC): `src/components/FlightSidebar.jsx`
- Data services: `src/api/opensky.js`, `src/api/airplaneslive.js`
- State/polling: `src/state/useFlights.js`
- Build config: `vite.config.js`

---

## 2) Data Flow (Fetcher → Store → UI)

1. App boot:
   - Electron loads `dist/index.html`.
   - React mounts `App.jsx`.
   - `App` schedules periodic updates (polling, default ~8–10s).

2. Fetching flights:
   - OpenSky: `GET /api/states/all` with optional bbox and Basic Auth from Settings; normalized via `mapOpenSkyStates`.
   - Airplanes.Live: `GET /v2/positions?bbox=minLat,minLon,maxLat,maxLon` mapped into OpenSky-like objects.
   - `useFlights` picks provider, applies interval/backoff, and can generate demo flights when enabled.

3. Merging and presentation:
   - In World mode the app maintains a rolling union (10 min TTL) to increase visible flights over time and smooth bursts.
   - The `Map.jsx` renders flights via Leaflet with `preferCanvas: true` and `CircleMarker`s for performance.
   - The flight sidebar lists and filters flights; clicking a marker or list item selects a flight for details.
   - Optional route lookup (AviationStack key) augments details with departure/arrival airport and airline.

4. Persistence:
   - `localStorage` stores:
     - Settings (mode, provider, polling, max markers, projections, credentials, optional API keys, demo flag)
     - Per-flight chat history (local only)

---

## 3) OpenSky Data Primer (What the `states` array means)

OpenSky returns an array of state vectors; each `state` is:

```
[0]  icao24            // Unique 24-bit ICAO aircraft address (hex string)
[1]  callsign          // Flight callsign (IATA/ICAO style), can be empty
[2]  origin_country    // Registration country
[3]  time_position     // Last position update (epoch secs)
[4]  last_contact      // Last update (epoch secs)
[5]  longitude         // deg
[6]  latitude          // deg
[7]  baro_altitude     // meters; may be null
[8]  on_ground         // boolean
[9]  velocity          // m/s (true airspeed)
[10] true_track        // deg (0..360), heading relative to north
[11] vertical_rate     // m/s (positive climb)
[12] sensors           // optional
[13] geo_altitude      // meters (if available)
[14] squawk            // transponder code
[15] spi               // special position indicator
[16] position_source   // ADS‑B, MLAT, etc.
```

The UI uses:
- `[5], [6]` to place markers on the map.
- `[7], [9], [10], [11]` to show altitude (m/ft), speed (km/h), heading (deg + cardinal), climb rate (m/s).
- `[1]` callsign for labels and route lookup.

---

## 4) Global Fetch Strategy (Why you still see fewer flights without VPN/API)

Anonymous OpenSky is IP rate-limited (HTTP 429). To mitigate:
- Try a single global call (`/states/all`) if credentials exist.
- Otherwise, tile the world into ~24 regions and fetch a batch sequentially with delays.
- Exponential backoff when 429 occurs (e.g., 500ms → 1s → 2s etc.)
- Merge results and de‑duplicate by `icao24`.
- Maintain a 10-minute union so counts ramp up over time.

Despite this, if your IP is throttled heavily, only an API key or VPN can guarantee instant, full‑world density.

Code: `src/services/opensky.js`

---

## 5) Map Rendering & Performance Techniques

File: `src/components/Map.jsx`
- `preferCanvas: true` and `CircleMarker` instead of default SVG markers → much better performance with thousands of points.
- Auto-disable projections (future dashed path) when many markers are visible.
- Small radius and minimal stroke to reduce draw cost.
- Popups avoided at scale; details are shown in the sidebar.
- Maker clicks still select a flight.

Additional performance:
- Lazy-load the map (React `lazy` + `Suspense`).
- Build tuned for small chunks: esbuild minification, vendor chunk split, `drop: ['console','debugger']` in production.

---

## 6) UI Components & Responsibilities

- `src/App.jsx`
  - Polling and lifecycle.
  - World/Viewport/Custom mode plumbing (World is default).
  - Rolling union store in World mode.
  - Passes data to components and tracks selected flight.

- `src/components/Settings.jsx`
  - Polling, bbox (for Viewport/Custom), Max Markers, projections toggle.
  - Credentials storage for OpenSky, optional AviationStack key.

- `src/components/FlightSidebar.jsx`
  - Flight list with search.
  - Details panel (altitude, speed, heading, airline/route if available).
  - Per-flight chat (local only).
  - Live ATC panel with embedded webview (generic LiveATC page or ICAO-targeted search if known).

- `src/components/Map.jsx`
  - Canvas markers and optional future projection line.
  - Viewport change events update bbox for Viewport mode.

---

## 7) Live ATC Integration

- Generic: embedded `webview` navigates to `https://www.liveatc.net`.
- If route lookup resolves ICAO codes, the app auto-navigates the webview to a targeted search (e.g., `https://www.liveatc.net/search/?icao=KJFK`).
- You can also open the current ATC URL externally in your browser.

Electron settings:
- `webviewTag: true` in `main.js` `webPreferences`.
- CSP allows `frame-src` for `liveatc.net`.

Note: Some LiveATC feeds require a separate subscription and may not embed audio due to site policies; the in-app panel is for convenience browsing/searching.

---

## 8) Security Considerations

- Development:
  - `webSecurity` is disabled, and CSP allows inline for ease of development. These relaxations trigger Electron warnings (expected in dev) but are safe to remove/tighten when packaging.
- Preload:
  - `preload.cjs` with `contextIsolation: true`, no Node/IPC exposed to the page.
- Production:
  - Enable stricter CSP and `webSecurity: true` if all remote resources are explicitly allowed (tiles, APIs, LiveATC), or serve resources via a controlled proxy.

---

## 9) Packaging

- Windows installer:
  - `npm run dist:win`
  - Output in `release/`.
- `asar` is enabled to shrink artifact size.
- You can provide a custom icon by placing `build/icon.ico` and wiring it in `package.json`.

---

## 10) Aviation Concepts (Quick Primer)

- ADS‑B (Automatic Dependent Surveillance–Broadcast):
  - Aircraft broadcast their position/velocity periodically.
  - OpenSky crowdsources these messages and exposes them as state vectors.

- ICAO24:
  - A unique 24‑bit hex address assigned to the airframe; stable identifier across flights.

- Callsign:
  - A human-readable flight identifier (e.g., AI101). Can be missing or stale.

- Barometric vs Geometric Altitude:
  - Barometric (`baro_altitude`) is derived from pressure and is commonly used operationally.
  - Geometric (`geo_altitude`) is GPS-based elevation; can be null.

- True Track (heading):
  - Angle relative to true north (degrees). Used to orient the aircraft icon and project a short future path.

- Velocity & Vertical Rate:
  - Velocity in m/s (converted to km/h in UI).
  - Vertical rate in m/s (positive climb, negative descent).

---

## 11) Extending Data Sources (Keys Needed)

- OpenSky (authenticated):
  - Add username/password in Settings to increase request limits. Sign up: https://opensky-network.org
- ADS‑B Exchange (recommended global coverage):
  - Provide RapidAPI/API key; we can add a `adsbx.js` service and a toggle in Settings to switch data source.
- AeroDataBox / AirLabs (metadata):
  - Add keys for routes/airports/airline enrichment.

Design notes for additional sources:
- Keep `fetchStates`-like interface to return normalized arrays `[icao24, callsign, …, lon, lat, …]` for compatibility.
- Introduce a `source` selector in Settings and swap service modules based on user choice.

---

## 12) Known Constraints & Tips

- Anonymous OpenSky is rate-limited; counts may be low without VPN/creds. If blocked (HTML portal response), switch to Airplanes.Live or enable Demo.
- For best performance at very high counts, keep projections disabled, limit Max Markers to your GPU capability, and avoid opening too many ATC pages at once.
- Map tiles are remote; ensure your network allows OSM/CARTO domains.

---

## 13) Quick Links to Code

- Electron main: `main.js`
- Preload: `preload.cjs`
- React app: `src/App.jsx`
- Map: `src/components/Map.jsx`
- Settings: `src/components/Settings.jsx`
- Flight sidebar (details, route, chat, ATC): `src/components/FlightSidebar.jsx`
- OpenSky service: `src/services/opensky.js`
- Build config: `vite.config.js`

---

## 14) Support

- If the app shows very few flights without VPN:
  - Add OpenSky credentials or use VPN.
  - Or provide another provider’s key (ADS‑B Exchange/AeroDataBox) and switch data source.

This concludes the deep-dive overview. For a quick start and user-oriented instructions, see `README.md`.
