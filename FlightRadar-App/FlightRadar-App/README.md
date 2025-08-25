# FlightRadar-App 🛩️

A real-time flight tracking desktop app built with Electron, React, Leaflet. It shows live aircraft from OpenSky (public REST) and supports an alternate provider (Airplanes.Live) plus an offline Demo mode. The app is optimized for fast rendering of thousands of aircraft using canvas markers.

## ✨ Highlights
- World-wide tracking (default World mode)
- Fast canvas rendering for thousands of markers
- Map marker click → details in right sidebar
- Optional route lookup (from/to/airline) via AviationStack key
- Settings for polling, max markers, projections toggle
- Works on Windows/macOS/Linux; installer build for Windows

## 🔌 Data Sources & Limits
- Default: OpenSky public REST (`/api/states/all` and bbox)
  - Anonymous access is rate-limited by IP (HTTP 429) and sometimes returns HTML “portal” pages instead of JSON.
  - Add your OpenSky credentials in Settings for better rate limits, or try a VPN.
  - Create a free account: [OpenSky Network registration](https://opensky-network.org/index.php?option=com_users&view=registration).
- Alternate: Airplanes.Live (no key)
  - Select Provider → Airplanes.Live in Settings. Uses bbox requests; good when OpenSky is blocked.
- Offline: Demo mode
  - Toggle “Offline Demo” in Settings to show simulated aircraft when live sources fail.
- Optional: AviationStack key for route metadata (From/To/Airline) on demand.

## 🚀 Quick Start
1. Install Node.js 18+
2. Install dependencies
   ```bash
   npm install
   ```
3. Run the app
   ```bash
   npm start
   ```
4. If Windows, you can also double-click `start.bat`.

## 🧪 Development
- Hot reload (web only):
  ```bash
  npm run dev
  ```
- Build frontend only:
  ```bash
  npm run build
  ```

## 🏗️ Package Desktop App (Windows)
```bash
npm run dist:win
```
- Output installer: `release/FlightRadar-App Setup <version>.exe`
- Portable build: `release/win-unpacked/FlightRadar-App.exe`

## 🖥️ App Usage
- The app opens in World mode by default and accumulates global flights.
- Top bar shows live aircraft count and last updated time.
- Right panel lists flights with search; click a marker to select a flight.
- Click "Lookup Route" (right panel) to fetch from/to/airline if you provided an AviationStack key.

## ⚙️ Settings
- Data Mode: World / Viewport / Custom bbox
- Provider: OpenSky or Airplanes.Live
- Polling (ms): How often to refresh (≥ 15000 recommended for OpenSky)
- Max Markers: Rendering cap (4000–10000 for powerful machines)
- Show Projections: Future 1‑min dashed line; auto-disables when many markers
- OpenSky credentials (optional): user/pass to increase rate limits
- Offline Demo: Simulated aircraft if live sources are blocked
- AviationStack Key (optional): enables route lookups

## ⚡ Performance
- Canvas-based CircleMarkers for speed (preferCanvas=true)
- Lightweight popups avoided at very large counts
- Projections disabled automatically when counts are high
- Prioritized world tiling and sequential fetching with backoff to improve coverage on rate-limited IPs

## 🧰 Troubleshooting
- 0 flights or very low counts:
  - Switch Provider to Airplanes.Live, or add OpenSky credentials.
  - Use Viewport mode with a small bbox; World mode may hit limits faster.
  - Test connectivity: open `https://opensky-network.org/api/states/all` in your browser; if you see HTML instead of JSON, your IP is blocked.
- Slow map with many markers:
  - Lower Max Markers in Settings or keep projections disabled.
- Route lookup not working:
  - Add an AviationStack key in Settings. We try `flight_iata` then `flight_icao` based on callsign.
- Desktop warnings in console:
  - Electron security warnings are expected in dev; they don’t appear in packaged builds.

## ✅ What works / ❗ What doesn’t (as of this build)
- Works:
  - Map rendering, selection, details, chat
  - Provider switch (OpenSky/Airplanes.Live)
  - Demo mode (offline simulation)
  - Windows packaging (.exe)
- Limitations:
  - OpenSky anonymous access often blocked; add credentials or use alternate provider.
  - Airplanes.Live endpoint availability may vary; keep Viewport focused if 404s occur.

## 🔒 Notes on Limits
- OpenSky anonymous access is shared and often rate-limited. For stable, instant full‑world density without VPN:
  - Use Airplanes.Live provider, or
  - Provide an API key (ADS‑B Exchange recommended) and we’ll integrate it, or
  - Create a free OpenSky account and add credentials in Settings.

## 🧱 Tech Stack
- Electron 30.x, React 18, Vite 5, Leaflet 1.9

## 📁 Project Layout
```
FlightRadar-App/
  src/
    components/
      Map.jsx           # Canvas markers, projections, click select
      Settings.jsx      # Settings panel
      FlightSidebar.jsx # Right panel: list, details, chat, route lookup
    services/
      opensky.js        # Data fetching with global tiling + backoff
    App.jsx             # App shell, lazy-loaded map
    styles.css          # UI styling
  main.js               # Electron main (preload.cjs)
  preload.cjs           # Preload (contextIsolation enabled)
  vite.config.js        # Build config (minify, code-split)
  package.json
```

## 🧭 Roadmap (optional enhancements)
- Integrate ADS‑B Exchange or AeroDataBox for higher-rate global data
- Cluster overlay at low zoom to reduce marker count further
- Persistent flight selection with follow mode
- Background service to prefetch/merge across sessions

## 📜 License
MIT

## 🙏 Acknowledgments
- OpenSky Network for public REST API
- OpenStreetMap / CARTO tiles
- AviationStack for route metadata (optional)
- Leaflet + React Leaflet