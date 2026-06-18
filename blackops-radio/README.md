# 🌍 BlackOps Radio Globe

**A stunning 3D interactive globe for streaming radio stations and news channels from around the world.**

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Electron](https://img.shields.io/badge/electron-24.0.0-blue)
![Three.js](https://img.shields.io/badge/threejs-r128-orange)

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Files Explanation](#-files-explanation)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Troubleshooting](#-troubleshooting)
- [Building for Distribution](#-building-for-distribution)

---

## ✨ Features

### 🎯 Core Features
- **Interactive 3D Earth Globe** - Real NASA texture with smooth rotation
- **45+ Verified Radio Stations** - 20 news + 25 music channels
- **Global Coverage** - Stations from 20+ countries across all continents
- **Live Audio Streaming** - High-quality streams with WebAudio visualization
- **Real-time Waveform Display** - Oscilloscope showing audio analysis
- **Smart Marker System** - Beautiful 3-layer markers with glow effects
- **Favorites System** - Save your favorite stations (uses localStorage)
- **Country Filters** - Filter by USA, UK, France, India, or view all
- **Search Function** - Find stations by name or country
- **Auto-Skip Failed Streams** - Automatically moves to next station if one fails

### 🎨 Visual Features
- **Active Station Highlighting** - White glow, 1.5x size, broadcasting beam
- **Dimmed Inactive Markers** - Other stations remain visible at 50% opacity
- **Pulsing Animations** - Smooth breathing effect on all markers
- **Rotating Rings** - Each station has an animated ring
- **Globe Controls** - Zoom in/out, reset view, toggle auto-rotate
- **Dark Theme UI** - Cyberpunk-inspired green terminal aesthetic

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

### Installation & Running

1. **Extract the project folder** to your desired location

2. **Open PowerShell** in the project folder (Right-click → Open in Terminal)

3. **Run the application:**
   ```powershell
   .\run.ps1
   ```
   
   This script will:
   - Check if `node_modules` exists
   - Install dependencies if needed (`npm install`)
   - Launch the application (`npm start`)

4. **First launch** will take 1-2 minutes to install dependencies

5. **Subsequent launches** are instant!

---

## 📁 Project Structure

```
blackops-radio/
├── main.js                 # Electron main process (backend)
├── preload.js             # Security bridge (IPC communication)
├── index.html             # Application UI structure
├── style.css              # Styling and theme
├── globe_v3_renderer.js   # 3D globe, radio logic, stations database
├── package.json           # Dependencies and project config
├── package-lock.json      # Dependency lock file
├── run.ps1               # Quick start script
├── build-windows.ps1     # Windows installer builder
├── seeds.json            # Fallback stations (backup)
├── README.md             # This file
├── node_modules/         # Dependencies (auto-generated)
└── dist/                 # Built installers (after build)
```

### ⚠️ Files You Can DELETE:
These files are **NOT needed** and can be safely removed:
- `seeds.json` - No longer used (stations are in `globe_v3_renderer.js`)
- Any `.txt` or backup files
- Any old versions of JavaScript files

---

## 🔧 How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    ELECTRON APP                          │
│                                                          │
│  ┌──────────────┐         ┌─────────────────────────┐  │
│  │   main.js    │◄───────►│   preload.js             │  │
│  │  (Backend)   │   IPC   │   (Security Bridge)      │  │
│  │              │         │                          │  │
│  │ • Creates    │         │ • Exposes safe API       │  │
│  │   window     │         │ • window.blackops.*      │  │
│  │ • Handles    │         │                          │  │
│  │   API calls  │         │                          │  │
│  └──────────────┘         └─────────────────────────┘  │
│         │                            │                  │
│         └────────────┬───────────────┘                  │
│                      ▼                                  │
│         ┌────────────────────────────┐                 │
│         │   Renderer Process          │                 │
│         │   (Frontend)                │                 │
│         │                             │                 │
│         │  • index.html               │                 │
│         │  • style.css                │                 │
│         │  • globe_v3_renderer.js     │                 │
│         │    - Three.js 3D globe      │                 │
│         │    - Station database       │                 │
│         │    - Audio streaming        │                 │
│         │    - WebAudio oscilloscope  │                 │
│         └────────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Startup:**
   - `main.js` creates Electron window
   - `preload.js` sets up secure IPC bridge
   - `index.html` loads and renders UI
   - `globe_v3_renderer.js` initializes 3D globe

2. **Loading Stations:**
   - Station database is hardcoded in `globe_v3_renderer.js`
   - 45 verified working streams (no API calls needed)
   - Markers created on globe at exact lat/lon coordinates

3. **User Interaction:**
   - User clicks marker on globe
   - `tuneStation()` function called
   - Audio element loads stream URL
   - WebAudio analyser connected
   - Waveform starts displaying

4. **Audio Pipeline:**
   ```
   Radio Stream URL → <audio> element → MediaElementSource → 
   AnalyserNode → FrequencyData → Canvas (Oscilloscope)
                  ↓
            AudioContext.destination (Speakers)
   ```

### Key Technologies

- **Electron 24** - Desktop app framework
- **Three.js r128** - 3D graphics rendering
- **WebAudio API** - Real-time audio analysis
- **Canvas API** - Waveform visualization
- **LocalStorage** - Favorites persistence

---

## 📄 Files Explanation

### 1. **main.js** (Backend - 100 lines)
**Purpose:** Electron main process, handles system-level operations

**Key Functions:**
- `createWindow()` - Creates the application window
- `ipcMain.handle('fetch-stations')` - Fetches stations from RadioBrowser API (backup)
- Window controls (minimize, close)

**Why it exists:** Electron needs a main process to manage the app lifecycle and system access.

---

### 2. **preload.js** (Security Bridge - 15 lines)
**Purpose:** Secure bridge between main and renderer process

**Exposes:**
```javascript
window.blackops.fetchStations(tag)  // Fetch from API
window.blackops.getUserDataPath()    // Get app data path
window.blackops.minimizeWindow()     // Minimize window
window.blackops.closeWindow()        // Close window
```

**Why it exists:** Security. Prevents renderer from accessing Node.js directly (XSS protection).

---

### 3. **index.html** (UI Structure - 150 lines)
**Purpose:** Application layout and structure

**Sections:**
- Top bar (mode buttons, search, window controls)
- Globe container (left side)
- Right panel (oscilloscope, station info, controls)

**Why it exists:** Standard HTML for app interface.

---

### 4. **style.css** (Styling - 400 lines)
**Purpose:** Visual design and theme

**Features:**
- Dark theme with green accents
- Cyberpunk terminal aesthetic
- Smooth animations and transitions
- Responsive layout
- Custom scrollbars

**Why it exists:** Makes the app beautiful and user-friendly.

---

### 5. **globe_v3_renderer.js** (Core Logic - 800 lines)
**Purpose:** The heart of the application

**Key Components:**

**A. Station Database (Lines 200-400)**
```javascript
function getWorkingStations(tag) {
  const newsStations = [...]; // 20 verified news channels
  const musicStations = [...]; // 25 verified music stations
  return tag === 'news' ? newsStations : musicStations;
}
```

**B. 3D Globe Setup (Lines 50-150)**
- Three.js scene, camera, renderer
- Earth texture loading
- Lighting setup
- Globe group creation

**C. Marker System (Lines 450-550)**
```javascript
createMarkers() {
  // For each station:
  // 1. Create glowing sphere (main dot)
  // 2. Create outer glow sphere
  // 3. Create rotating ring
  // 4. Add to earthGroup (rotates with globe)
}
```

**D. Audio Streaming (Lines 600-650)**
- HTML5 audio element
- WebAudio context
- MediaElementSource connection
- AnalyserNode for waveform

**E. Waveform Visualization (Lines 650-700)**
```javascript
drawWaveform() {
  // 1. Get time-domain data from analyser
  // 2. Clear canvas
  // 3. Draw waveform line
  // 4. Loop (requestAnimationFrame)
}
```

**F. Animation Loop (Lines 750-800)**
- Globe auto-rotation (optional)
- Marker pulsing animations
- Ring rotations
- Active station pulse ring

**Why it exists:** Contains ALL the app logic, station data, and 3D rendering.

---

### 6. **package.json** (Project Config - 40 lines)
**Purpose:** Defines project metadata and dependencies

**Dependencies:**
- `electron`: ^24.0.0 - Desktop app framework
- `three`: ^0.150.0 - 3D graphics library
- `node-fetch`: ^3.3.0 - HTTP requests (for API fallback)

**Scripts:**
- `npm start` - Launches the app
- `npm run build` - Builds Windows installer

**Why it exists:** npm standard for Node.js projects.

---

### 7. **run.ps1** (Quick Start - 20 lines)
**Purpose:** One-click launch script

**Logic:**
```powershell
if node_modules doesn't exist:
    run npm install
run npm start
```

**Why it exists:** Convenience. Users just double-click to run.

---

### 8. **build-windows.ps1** (Installer Builder - 30 lines)
**Purpose:** Creates Windows executable installer

**Output:** 
- `dist/BlackOps Radio Globe Setup.exe` (50-100 MB)

**Why it exists:** Distributable app for other users.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` | Previous station |
| `→` | Next station |
| `Enter` | Search (when in search box) |
| `Mouse Drag` | Rotate globe |
| `Mouse Wheel` | Zoom in/out |

---

## 🐛 Troubleshooting

### Problem: "npm is not recognized"
**Solution:** Install Node.js from [nodejs.org](https://nodejs.org/)

### Problem: Station says "Failed to connect"
**Solution:** 
- This is normal for some streams
- App will auto-skip to next station
- Try next/previous buttons

### Problem: No sound
**Solution:**
1. Check system volume
2. Check app volume slider (bottom right)
3. Try different station
4. Restart the app

### Problem: Globe is black/not loading
**Solution:**
1. Wait 5 seconds (texture loading)
2. Check internet connection
3. Restart the app

### Problem: "Error: Cannot find module"
**Solution:**
```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
npm start
```

---

## 📦 Building for Distribution

### Create Windows Installer

1. Open PowerShell in project folder

2. Run build script:
   ```powershell
   .\build-windows.ps1
   ```

3. Wait 2-5 minutes for build to complete

4. Find installer in `dist/` folder:
   ```
   dist/BlackOps Radio Globe Setup 1.0.0.exe
   ```

5. **Share this .exe** with others - it includes everything!

### Build Output
- Installer size: ~100 MB
- Includes: Node.js, Electron, Three.js, all dependencies
- Users just run the installer - no Node.js needed!

---

## 🎯 Usage Tips

### Finding Stations
- **Click markers** on globe to tune
- **Search bar** - type country or station name
- **Filter buttons** - Quick access to USA, UK, France, India
- **Favorites** - Star icon to save favorites

### Globe Controls
- **Drag** - Rotate globe
- **Scroll** - Zoom in/out
- **🎯 Button** - Reset view
- **⟲ Button** - Toggle auto-rotate

### Best Practices
- Start with NEWS mode (more reliable streams)
- Use volume slider (25% default is good)
- Save favorites for quick access
- Use country filters to explore regions

---

## 📊 Station List

### NEWS (20 stations)
- 🇺🇸 USA: NPR, WNYC, KQED, WBUR
- 🇬🇧 UK: BBC World Service, BBC Radio 4
- 🇨🇦 Canada: CBC Radio One
- 🇮🇪 Ireland: RTE Radio 1
- 🇫🇷 France: France Info, RFI
- 🇩🇪 Germany: Deutschlandfunk
- 🇮🇹 Italy: RAI Radio 1
- 🇳🇱 Netherlands: NPO Radio 1
- 🇸🇪 Sweden: Sveriges Radio P1
- 🇳🇴 Norway: NRK P1
- 🇫🇮 Finland: YLE Radio 1
- 🇨🇿 Czech: Radio Prague
- 🇵🇱 Poland: Polskie Radio
- 🇦🇺 Australia: ABC NewsRadio
- 🇳🇿 New Zealand: Radio NZ

### MUSIC (25 stations)
- 🇺🇸 USA: KEXP, WFMU, KCRW, Radio Paradise, The Current, KUTX, WXPN, WWOZ, KCSN
- 🇬🇧 UK: BBC Radio 1, BBC 6 Music, NTS Radio, Rinse FM
- 🇫🇷 France: FIP, Radio Nova, TSF Jazz
- 🇮🇪 Ireland: RTE 2FM
- 🇩🇪 Germany: Radio Eins
- 🇨🇭 Switzerland: Radio Meuh
- 🇸🇪 Sweden: Sveriges Radio P3
- 🇳🇴 Norway: NRK P3
- 🇫🇮 Finland: YLE X3M
- 🇦🇺 Australia: Triple J, Double J
- 🇭🇰 Hong Kong: Radio 3

---

## 🔧 Technical Details

### Performance
- **60 FPS** smooth rendering
- **Optimized geometry** (48 segments vs 64)
- **Frame rate limiting** to prevent CPU overuse
- **Throttled mouse events** (16ms throttle = 60fps)

### Memory Usage
- **~150 MB RAM** (typical)
- **~50 MB GPU** for 3D rendering
- Efficient marker pooling
- Proper cleanup on mode switch

### Security
- **Context isolation** enabled
- **Node integration** disabled in renderer
- **IPC whitelist** (only specific functions exposed)
- **No eval()** or dangerous functions

---

## 📝 License

MIT License - Free to use, modify, and distribute.

---

## 🙏 Credits

- **Three.js** - 3D graphics library
- **Electron** - Desktop app framework
- **NASA** - Earth texture
- **RadioBrowser API** - Station database
- **Public radio stations** - Content providers

---

## 📧 Support

Having issues? Check:
1. This README troubleshooting section
2. Ensure Node.js is installed
3. Try deleting `node_modules` and reinstalling
4. Check system audio/volume settings

---

**Enjoy exploring radio stations from around the world! 🌍📻**