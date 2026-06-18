import { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { TacticalGlobe } from './components/TacticalGlobe';
import { Oscilloscope } from './components/Oscilloscope';

import { Dashboard } from './components/Dashboard';
import { NetworkStats } from './components/NetworkStats';
import { SignalMeter } from './components/SignalMeter';
import { EncryptedLog } from './components/EncryptedLog';
import { DecryptionOverlay } from './components/DecryptionOverlay';
import { BootSequence } from './components/BootSequence';
import { RadioControlBox } from './components/RadioControlBox';
import { AudioEngine } from './lib/audioEngine';
import { fetchStations } from './lib/radioBrowser';
import { fetchSatellites, type SatelliteData } from './lib/satelliteUtils';
import { VERIFIED_STATIONS } from './data/verifiedStations';
import type { Station } from './types';
import { ShieldAlert, Globe } from 'lucide-react';

// Global audio tracker to prevent overlap
let currentAudio: HTMLAudioElement | null = null;

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [isOn, setIsOn] = useState(false); // Start OFF, boot sequence turns it on
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stations, setStations] = useState<Station[]>(VERIFIED_STATIONS);
  const [volume, setVolume] = useState(0.5);
  const [isJamming, setIsJamming] = useState(false);
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteData | null>(null);

  const [audioEngine] = useState(() => new AudioEngine());

  // Update volume when changed
  useEffect(() => {
    audioEngine.setMasterVolume(volume);
  }, [volume, audioEngine]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      // Stations
      const fetchedStations = await fetchStations(3000);
      setStations([...VERIFIED_STATIONS, ...fetchedStations]);

      // Satellites
      const sats = await fetchSatellites();
      setSatellites(sats);
    };
    loadData();

    return () => {
      audioEngine.stopAll();
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
    };
  }, []);

  const handleBootComplete = () => {
    setIsBooting(false);
    togglePower(); // Turn on after boot
  };

  const togglePower = async () => {
    if (!isOn) {
      await audioEngine.initialize();
      audioEngine.startStatic();
      setIsOn(true);
    } else {
      setIsOn(false);
      setIsPlaying(false);
      audioEngine.stopAll();
      setCurrentStation(null);
      setIsLocked(false);
    }
  };

  const togglePlay = () => {
    if (!currentStation) return;
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.resume();
      setIsPlaying(true);
    }
  };

  const handleIntercept = () => {
    if (!isOn || stations.length === 0) return;
    const randomStation = stations[Math.floor(Math.random() * stations.length)];
    handleStationSelect(randomStation);
  };

  const toggleJammer = () => {
    if (isJamming) {
      setIsJamming(false);
      audioEngine.stopNoise();
      if (currentStation && isLocked) {
        audioEngine.playStream(currentStation.streamUrl);
        setIsPlaying(true);
      }
    } else {
      setIsJamming(true);
      audioEngine.stopAll();
      audioEngine.startNoise();
      setIsPlaying(false);
    }
  };

  // Scanner Logic
  const [isScanning, setIsScanning] = useState(false);
  const scanInterval = useRef<number | null>(null);

  const toggleScan = () => {
    if (isScanning) {
      setIsScanning(false);
      if (scanInterval.current) clearInterval(scanInterval.current);
      audioEngine.stopNoise();
    } else {
      setIsScanning(true);
      setIsPlaying(false);
      setIsLocked(false);
      audioEngine.startStatic();

      scanInterval.current = window.setInterval(() => {
        const randomStation = stations[Math.floor(Math.random() * stations.length)];
        setCurrentStation(randomStation);
      }, 200);
    }
  };

  const handleStationSelect = (station: Station) => {
    if (!isOn) return;

    if (isScanning) {
      toggleScan();
    }

    setCurrentStation(station);
    setIsLocked(false);
    setIsPlaying(false);
    audioEngine.startStatic();

    // FAST TUNING: Reduced delay to 500ms for "fast" feel
    setTimeout(() => {
      setIsLocked(true);
      if (!isJamming) {
        audioEngine.playStream(station.streamUrl);
        setIsPlaying(true);
      }
    }, 500);
  };

  const [filterType, setFilterType] = useState<'ALL' | 'NEWS' | 'MUSIC'>('ALL');
  const [search, setSearch] = useState('');

  const filteredStations = stations.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.region.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || s.type === filterType;
    return matchesSearch && matchesType;
  });

  if (isBooting) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  return (
    <Layout isOn={isOn}>
      <div className="h-24 border-b border-tactical-dim flex items-center px-6 bg-black/80 backdrop-blur z-10 relative">
        {/* LEFT: Title */}
        <div className="flex-1 flex items-center gap-4 justify-start">
          <div className="w-3 h-3 bg-tactical-highlight rounded-full animate-pulse"></div>
          <h1 className="text-2xl font-bold text-glow tracking-widest">BLACKOPS RADIO</h1>
        </div>

        {/* CENTER: Control Box */}
        <div className="flex-none flex items-center justify-center absolute left-1/2 -translate-x-1/2">
          <RadioControlBox
            isOn={isOn}
            togglePower={togglePower}
            volume={volume}
            setVolume={setVolume}
            isLocked={isLocked}
          />
        </div>

        {/* RIGHT: Action Buttons */}
        <div className="flex-1 flex items-center gap-3 justify-end">
          <button
            onClick={handleIntercept}
            className="flex items-center gap-2 px-3 py-2 border border-tactical-dim hover:border-tactical-highlight hover:bg-tactical-highlight/10 rounded transition-all text-xs font-bold tracking-widest"
          >
            <Globe size={14} /> INTERCEPT
          </button>
          <button
            onClick={toggleJammer}
            className={`flex items-center gap-2 px-3 py-2 border rounded transition-all text-xs font-bold tracking-widest ${isJamming ? 'border-red-500 text-red-500 bg-red-500/10 animate-pulse' : 'border-tactical-dim hover:border-red-500 hover:text-red-500'}`}
          >
            <ShieldAlert size={14} /> JAMMER
          </button>
          <button
            onClick={toggleScan}
            className={`flex items-center gap-2 px-3 py-2 border rounded transition-all text-xs font-bold tracking-widest ${isScanning ? 'border-tactical-highlight text-tactical-highlight bg-tactical-highlight/10 animate-pulse' : 'border-tactical-dim hover:border-tactical-highlight hover:text-tactical-highlight'}`}
          >
            <Globe size={14} /> SCAN
          </button>
        </div>
      </div>

      <div className="h-[calc(100vh-6rem)] flex gap-4 p-4 overflow-hidden relative bg-black">
        {/* Decryption Overlay */}
        {!isLocked && currentStation && !isScanning && (
          <DecryptionOverlay
            isLocked={isLocked}
            stationName={currentStation.name}
            onComplete={() => { }}
          />
        )}

        {/* LEFT COLUMN */}
        <div className="w-[25%] min-w-[300px] flex flex-col gap-4 h-full relative shrink-0">
          <div className="h-1/3 border border-tactical-dim rounded-lg p-4 bg-black/50 relative overflow-hidden flex flex-col gap-2">
            <div className="absolute top-2 right-2 text-xs text-tactical-dim">SYS.STATUS</div>
            <div className="flex justify-between text-sm mt-4">
              <span className="text-tactical-dim">SIGNAL</span>
              <SignalMeter level={isPlaying ? (volume * 0.8 + Math.random() * 0.2) : 0} />
            </div>
            <Oscilloscope audioEngine={audioEngine} isOn={isOn} />
          </div>
          <NetworkStats />
          <div className="flex-1 border border-tactical-dim rounded bg-black/50 p-2 overflow-hidden">
            <div className="text-[10px] text-tactical-dim mb-2">ENCRYPTED LOG</div>
            <EncryptedLog />
          </div>
        </div>

        {/* CENTER COLUMN (GLOBE) */}
        <div className="flex-1 h-full min-w-0 border border-tactical-dim rounded-lg bg-black/50 relative overflow-hidden flex items-center justify-center">
          <div className="absolute top-2 right-2 z-50 text-tactical-highlight text-xs">
            STATIONS: {filteredStations.length}
          </div>

          {isJamming && (
            <div className="absolute inset-0 z-40 pointer-events-none bg-repeat opacity-20" style={{ backgroundImage: 'url("https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif")' }}></div>
          )}

          {selectedSatellite && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/90 border border-tactical-highlight p-4 rounded text-center pointer-events-none min-w-[200px]">
              <div className="text-[10px] text-tactical-dim tracking-widest mb-1">ORBITAL TARGET</div>
              <div className="text-xl font-bold text-tactical-highlight mb-1">{selectedSatellite.name}</div>
              <div className="flex justify-between text-xs text-tactical-text font-mono border-t border-tactical-dim/30 pt-2 mt-2">
                <span>ID: {selectedSatellite.id}</span>
                <span className={
                  selectedSatellite.type === 'MIL' ? 'text-red-500' :
                    selectedSatellite.type === 'GPS' ? 'text-green-500' :
                      selectedSatellite.type === 'COMM' ? 'text-cyan-500' : 'text-yellow-500'
                }>{selectedSatellite.type}</span>
              </div>
              <div className="text-[10px] text-tactical-dim mt-1">STATUS: <span className="text-green-500 animate-pulse">ONLINE</span></div>
            </div>
          )}

          <TacticalGlobe
            stations={filteredStations}
            satellites={satellites}
            selectedStation={currentStation}
            onSelect={handleStationSelect}
            selectedSatellite={selectedSatellite}
            onSelectSatellite={setSelectedSatellite}
          />
        </div>

        {/* RIGHT COLUMN (DASHBOARD) */}
        <div className="w-[25%] min-w-[300px] h-full shrink-0">
          <Dashboard
            stations={filteredStations}
            satellites={satellites}
            currentStation={currentStation}
            onSelect={handleStationSelect}
            onSelectSatellite={setSelectedSatellite}
            selectedSatellite={selectedSatellite}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            filterType={filterType}
            setFilterType={setFilterType}
            search={search}
            setSearch={setSearch}
            volume={volume}
            setVolume={setVolume}
          />
        </div>
      </div>
    </Layout>
  );
}

export default App;
