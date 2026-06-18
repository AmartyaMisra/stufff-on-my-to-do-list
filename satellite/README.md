# 🛸 Space Anomaly Radar

**A True Live Space Signal Intelligence System**

Real-time, multi-channel anomaly detection and fusion console that continuously ingests public space data, monitors the electromagnetic environment, and highlights unusual signals — while admitting uncertainty.

![Dashboard Screenshot](docs/dashboard.png)

---

## 🎯 Purpose

This is NOT a static dashboard or UI demo. It is a **live watcher system** that:

- **Continuously ingests** real public data (NOAA solar wind, ISS position)
- **Listens** to the electromagnetic environment (simulated WebSDR)
- **Detects anomalies** including unexplained/engineered-looking signals
- **Correlates** multiple sources to identify meaningful patterns
- **Reacts immediately** to both data changes and user actions
- **Admits uncertainty** with confidence scores and alternative explanations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │  Radar  │ │ SkyMap  │ │ Gauges  │ │Waterfall│ │ Classification│
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └──────┬────┘ │
│       └───────────┴───────────┴───────────┴─────────────┘      │
│                              ▼                                  │
│                    WebSocket / REST API                         │
└─────────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI/Python)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ NOAA Live   │  │ ISS Tracker │  │RadioMonitor │              │
│  │ (Solar Wind)│  │ (TLE/CelesTrak)│ │(WebSDR Sim) │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         └────────────────┴─────────────────┘                    │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    DETECTION LAYER                          ││
│  │  • SETI Classifier (narrowband, doppler, repetition)        ││
│  │  • Silence Detector (missing signals, HF blackout)          ││
│  │  • FRB Generator (probabilistic burst simulation)           ││
│  │  • GW Ingester (gravitational wave events)                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    FUSION ENGINE                            ││
│  │  • Multi-channel correlation                                ││
│  │  • Spatial overlap detection                                ││
│  │  • Evidence chain generation                                ││
│  └─────────────────────────────────────────────────────────────┘│
│                          ▼                                      │
│                    SQLite Database                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 | UI framework |
| | D3.js | Radar visualization |
| | Three.js | 3D SkyMap/Globe |
| | Axios | API communication |
| **Backend** | Python 3.11 | Runtime |
| | FastAPI | REST API framework |
| | SQLAlchemy | ORM |
| | SQLite | Database |
| **Data Sources** | NOAA SWPC | Real solar wind data |
| | Open-Notify | ISS position API |
| | WebSDR (simulated) | Radio monitoring |

---

## 📡 Data Channels

| Channel | Source | Color | Visual |
|---------|--------|-------|--------|
| SPACEWEATHER | NOAA SWPC (Live) | Yellow | Circle |
| FRB | Simulated CHIME | Orange | Circle |
| HAM RADIO | WebSDR (Simulated) | Green | Circle |
| TLE | CelesTrak/Open-Notify | Gray | Square + "KNOWN:" |
| SILENCE | Absence Detector | Red | Hollow Ring |
| FUSION | Multi-channel Correlation | Magenta | Diamond |
| GW | Simulated LIGO | Purple | Circle |

---

## ✨ Features

### ✅ Implemented

1. **Live Data Ingestion**
   - NOAA SWPC solar wind (real API)
   - ISS position tracking (real API)
   - Source labels with timestamps

2. **Radio Monitoring**
   - Simulated WebSDR power monitoring
   - Anomaly detection: spikes, silence, narrowband carriers
   - GREEN radar blips for radio events

3. **SETI-Style Classification**
   - Narrowband detection
   - Doppler drift analysis
   - Repetition pattern matching
   - "ARTIFICIAL_CANDIDATE" classification

4. **Negative-Space Detection**
   - Missing signal detection (ISS dropout)
   - HF blackout correlation with solar activity
   - Red hollow collapsing rings on radar

5. **Multi-Channel Fusion**
   - Temporal correlation
   - Evidence chain generation
   - "FUSION EVIDENCE" panel with reasons

6. **Click-to-Focus Interaction**
   - Click radar blip → Signal Analysis updates
   - SkyMap highlights selected event
   - FOCUS MODE dims other blips

7. **Demo/Live Mode Toggle**
   - 📡 LIVE MODE (green) - Real data only
   - 🎭 DEMO MODE (orange) - Synthetic events enabled

8. **Known Transmitter Baseline**
   - ISS labeled as "KNOWN: ISS"
   - Squares instead of circles
   - Low visual priority

### ❌ Not Implemented

1. **Real WebSDR Integration** - Requires browser automation (Selenium) to scrape live spectrum data. Currently simulated with probability-based events.

2. **Waterfall Filter on Selection** - Clicking event should filter waterfall to that frequency. Not implemented due to time constraints.

3. **Narrative Log Auto-Scroll** - Log should scroll to selected event. Not implemented.

4. **Backend Demo Mode Skip** - Backend should skip synthetic data when frontend is in Live mode. Frontend toggle exists but backend doesn't receive the flag.

5. **Real CubeSat Catalog** - Only ISS is tracked. Full satellite beacon database not integrated.

6. **Real Gravitational Wave Alerts** - GW events are simulated. Real GraceDB integration not implemented.

7. **Real IceCube Neutrino Alerts** - Neutrino events are simulated.

8. **Production Deployment** - No Docker production config, auth, or scaling.

---

## 🚀 Quick Start

### Windows (Recommended)

**Double-click** `launch.bat` or run:

```batch
.\launch.bat
```

This will:
1. Install Python dependencies
2. Install Node.js dependencies
3. Start backend on http://localhost:8000
4. Start frontend on http://localhost:3000

### Manual Start

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

---

## 📁 Project Structure

```
satellite/
├── backend/
│   ├── main.py              # FastAPI app, all endpoints
│   ├── threat_engine.py     # Threat state computation
│   ├── fusion_engine.py     # Multi-channel fusion
│   ├── frb_generator.py     # FRB event simulation
│   ├── gw_ingester.py       # GW event simulation
│   ├── database/
│   │   └── models.py        # SQLAlchemy models
│   ├── detection/
│   │   ├── seti_classifier.py   # Artificial signal detection
│   │   ├── silence_detector.py  # Negative-space detection
│   │   └── quiet_zone_monitor.py
│   └── ingestion/
│       ├── noaa_live.py     # Real NOAA API
│       ├── iss_tracker.py   # Real ISS position API
│       ├── radio_monitor.py # Simulated WebSDR
│       └── tle_tracker.py   # TLE parsing
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app, state management
│   │   └── components/
│   │       ├── Radar.jsx        # D3 radar display
│   │       ├── SkyMap.jsx       # Three.js globe
│   │       ├── Gauges.jsx       # NOAA data display
│   │       ├── Waterfall.jsx    # Spectral display
│   │       ├── FusionPanel.jsx  # Narrative log
│   │       ├── ThreatIndicator.jsx
│   │       ├── RadioSpectrum.jsx
│   │       └── SignalClassificationPanel.jsx
│   └── package.json
├── launch.bat               # Windows launcher
├── requirements.txt         # Python dependencies
└── README.md
```

---

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tick` | POST | Main system tick (polls all sources) |
| `/api/status` | GET | Current threat state |
| `/events` | GET | Recent events |
| `/api/spaceweather/latest` | GET | Latest NOAA data |
| `/api/fusion/latest` | GET | Latest fusion event |
| `/api/signals/classify/{id}` | POST | Run SETI classification |
| `/api/scenario/wow_signal` | POST | Trigger "Wow Signal" event |

---

## 🧠 Detection Logic

### SETI Classification
```python
# Narrowband score: BW < 100 Hz = artificial candidate
narrowband_score = max(0, 1 - (bandwidth_hz / 100))

# Doppler drift score: Non-zero drift = moving source
doppler_score = min(1, abs(doppler_drift_hz_per_s) / 0.1)

# Final classification
if narrowband_score > 0.7 and doppler_score > 0.5:
    classification = "ARTIFICIAL_CANDIDATE"
```

### Fusion Evidence
```python
# Evidence chain built from active channels
if "spaceweather" in channels:
    reasons.append("Solar/geomagnetic activity influencing propagation")
if "frb" in channels:
    reasons.append("Fast Radio Burst detected - extragalactic origin")
if "radio_monitor" in channels:
    reasons.append("Radio spectrum anomaly on monitored bands")
```

---

## ⚠️ Limitations

1. **Simulated Radio Data** - Real WebSDR requires Selenium, not implemented
2. **No Real GW/Neutrino** - Waiting for real events is impractical for demo
3. **SQLite** - Not suitable for production (use PostgreSQL)
4. **No Authentication** - Open access to all endpoints
5. **Single Instance** - No horizontal scaling

---

## 📜 License

MIT License - Use freely, modify as needed.

---

## 🙏 Acknowledgments

- **NOAA SWPC** - Real solar wind data
- **Open-Notify** - ISS position API
- **University of Twente WebSDR** - Inspiration for radio monitoring
- **CHIME/FRB** - Inspiration for burst detection
- **LIGO/Virgo** - Inspiration for GW detection
