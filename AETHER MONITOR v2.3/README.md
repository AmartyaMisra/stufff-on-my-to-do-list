# AETHER MONITOR v2.3

> A cyberpunk-styled global intelligence monitoring dashboard with real-time satellite tracking, incident feeds, radio streams, and weather visualization.

![AETHER Monitor](https://img.shields.io/badge/version-2.3-cyan) ![React](https://img.shields.io/badge/React-18-blue) ![Three.js](https://img.shields.io/badge/Three.js-3D%20Globe-green)

---

## 🎯 Vision & Purpose

AETHER Monitor is a **NASA/NORAD-inspired** intelligence dashboard that combines:
- **3D Earth Globe** with real satellite tracking (SGP4 propagation)
- **Real-time Incident Intelligence** from global sources (USGS, city open data, geopolitical events)
- **Live Radio Streams** from around the world (BBC, NPR, KEXP, FIP, etc.)
- **ATC/Aviation Feeds** from LiveATC
- **Police/Fire Scanners** via Broadcastify
- **NOAA Weather Radio** and weather map overlays

The goal is to create an immersive, futuristic monitoring experience with a **cyberpunk/glassmorphism aesthetic**.

---

## 🚀 Quick Start

### One-Click Launch
```batch
Double-click LAUNCH.bat
```

### Manual Start
```bash
# Terminal 1 - Backend Server
node server.js

# Terminal 2 - Frontend
npm run dev

# Open http://localhost:5173 in browser
```

---

## 📁 Project Structure

```
radio/
├── LAUNCH.bat              # One-click launcher
├── server.js               # Node.js proxy server (CORS bypass, incident aggregation)
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── index.html              # Entry HTML
├── src/
│   ├── App.jsx             # Main application (2890 lines)
│   ├── App.css             # Global styles
│   ├── main.jsx            # React entry point
│   ├── index.css           # Base CSS
│   ├── FeedPlayer.jsx      # Audio player component
│   ├── components/
│   │   ├── EmbeddedMaps.jsx    # Incident feed, HAM radio panels, weather map
│   │   ├── StationCard.jsx     # Station display card
│   │   └── StationList.jsx     # Station list component
│   └── utils/
│       └── audioManager.js     # Audio stream management
├── public/
│   ├── data/
│   │   ├── stations.tle        # Satellite TLE data
│   │   ├── global-cities.json  # City database
│   │   └── *.json              # Configuration files
│   └── models/                 # 3D models (if any)
└── README.md
```

---

## 🔧 Technologies Used

| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **Three.js** | 3D Globe rendering |
| **satellite.js** | SGP4 satellite propagation |
| **Vite** | Build tool & dev server |
| **TailwindCSS** | Styling |
| **Node.js/Express** | Backend proxy server |
| **Axios** | HTTP requests |

---

## 🎛️ Application Modes

| Mode | Description |
|------|-------------|
| **GLOBAL RADIO** | 100+ radio stations worldwide (BBC, NPR, FIP, SomaFM, etc.) |
| **NEWS WIRE** | News broadcasts (BBC World Service, NPR, Deutsche Welle, etc.) |
| **INCIDENT DATA** | Real-time SIGINT-style incident feed (earthquakes, fires, conflicts) |
| **ATS DATALINK** | Air Traffic Control feeds from LiveATC |
| **METEOROLOGICAL DATA** | Weather map (Windy.com) + NOAA Weather Radio |

---

## 📡 Data Sources

### Incident Data
- **USGS Earthquake Feed** - Real-time seismic events
- **Chicago Open Data** - Crime/incident reports
- **NYC 311** - City complaints and incidents
- **Geopolitical Intel** - Simulated OSINT (Ukraine, Gaza, Sudan, etc.)

### Radio Streams
- **SomaFM** - 20+ ambient/electronic channels (reliable)
- **Radio Paradise** - High-quality music streams
- **FIP France** - French public radio (multiple genres)
- **BBC World Service** - International news
- **NPR** - US public radio
- **LiveATC** - ATC feeds (may require authentication)
- **Broadcastify** - Police/Fire scanners (rate-limited)
- **weatherusa.net** - NOAA Weather Radio

### Satellite Data
- **Celestrak TLE** - Real satellite orbital elements
- **SGP4 Propagation** - Accurate position calculation

---

## ⚠️ Known Issues & Limitations

### What Works ✅
- 3D Globe with day/night cycle, clouds, stars
- Satellite visualization (Starlink, GPS, ISS, Weather, NOAA)
- SomaFM, Radio Paradise, FIP streams (reliable)
- BBC World Service, NPR News streams
- Incident data feed with geopolitical events
- Weather map via Windy.com embed

### What Has Issues ⚠️
| Feature | Issue | Reason |
|---------|-------|--------|
| **LiveATC** | Some streams fail | Requires authentication/cookies |
| **Broadcastify** | Inconsistent | Rate-limited, requires premium for full access |
| **NOAA Weather Radio** | Some offline | weatherusa.net streams not 100% reliable |
| **Satellites freeze** | Occasional | High CPU usage or browser tab inactive |

### Why Some Features Don't Work
1. **LiveATC/Broadcastify require authentication** - These services detect proxy connections
2. **CORS restrictions** - Many streams block cross-origin requests
3. **Rate limiting** - Free tiers have request limits
4. **Stream availability** - Some feeds go offline during quiet hours

---

## 🔄 Development History

### What We Implemented
1. ✅ 3D Earth Globe with Three.js (PBR textures, clouds, atmosphere)
2. ✅ Real satellite tracking with SGP4 propagation
3. ✅ SIGINT-style incident feed replacing 3D globe map
4. ✅ HAM radio panels for each mode
5. ✅ 100+ global radio stations with real names
6. ✅ Weather map integration (Windy.com)
7. ✅ Cyberpunk/glassmorphism UI design
8. ✅ Audio visualizer
9. ✅ Node.js proxy server for CORS bypass
10. ✅ Geopolitical incident data (Ukraine, Gaza, Sudan, etc.)

### What Didn't Work (And Why)
| Attempt | Why It Failed |
|---------|---------------|
| Direct Broadcastify streams | CORS + authentication required |
| Direct LiveATC streams | Same - requires cookies |
| OpenWeatherMap overlay | API key + embedding issues |
| Real-time police scanners | Broadcastify premium only |
| 3D incident globe with markers | Geo-accuracy issues, replaced with text feed |

---

## 📋 Steps to Run

1. **Install dependencies** (first time only):
   ```bash
   npm install
   ```

2. **Launch the application**:
   ```bash
   # Double-click LAUNCH.bat
   # OR run manually:
   node server.js
   npm run dev
   ```

3. **Open in browser**:
   ```
   http://localhost:5173
   ```

4. **Explore modes** using the top navigation bar

---

## 🎨 UI Features

- **Glassmorphism panels** with blur effects
- **Neon glow** accents (cyan, violet, red)
- **Monospace console font** for incident feed
- **Animated audio visualizer**
- **Draggable/minimizable panels**
- **Real-time UTC clock**
- **FPS counter**
- **Scanline overlay effect**

---

## 🔮 Future Improvements

- [ ] WebRTC-based audio for better stream reliability
- [ ] User authentication for premium stream access
- [ ] Custom TLE upload for satellite tracking
- [ ] Historical incident playback
- [ ] Mobile responsive design
- [ ] Electron wrapper for desktop app

---

## 📜 License

MIT License - Feel free to modify and share.

---

*Built with ☕ and 🎧 by the AETHER Team*
