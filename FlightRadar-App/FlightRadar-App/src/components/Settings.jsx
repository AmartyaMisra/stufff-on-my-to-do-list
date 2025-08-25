import React, { useEffect, useState } from 'react'

export default function Settings ({ bbox, onBboxChange, intervalMs, onIntervalChange, onPerfChange, mode, onModeChange }) {
  const [minLat, setMinLat] = useState(bbox.minLat)
  const [maxLat, setMaxLat] = useState(bbox.maxLat)
  const [minLon, setMinLon] = useState(bbox.minLon)
  const [maxLon, setMaxLon] = useState(bbox.maxLon)
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [showProjections, setShowProjections] = useState(true)
  const [maxMarkers, setMaxMarkers] = useState(1000)
  const [localMode, setLocalMode] = useState(mode || 'viewport')
  const [avKey, setAvKey] = useState('')
  const [demoMode, setDemoMode] = useState(localStorage.getItem('demo_mode') === '1')
  const [provider, setProvider] = useState(localStorage.getItem('provider') || 'opensky')

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('openskyCreds') || 'null')
    if (saved) {
      setUser(saved.username || saved.user || '')
      setPass(saved.password || saved.pass || '')
    }
    const perf = JSON.parse(localStorage.getItem('perf') || 'null')
    if (perf) {
      setShowProjections(perf.showProjections ?? true)
      setMaxMarkers(perf.maxMarkers ?? 1000)
    }
    const savedMode = localStorage.getItem('mode')
    if (savedMode) setLocalMode(savedMode)
    const savedKey = localStorage.getItem('aviationstack_key')
    if (savedKey) setAvKey(savedKey)
  }, [])

  useEffect(() => {
    onPerfChange?.({ showProjections, maxMarkers: Number(maxMarkers) || 1000 })
  }, [showProjections, maxMarkers])

  const save = () => {
    onBboxChange({ minLat: parseFloat(minLat), maxLat: parseFloat(maxLat), minLon: parseFloat(minLon), maxLon: parseFloat(maxLon) })
    localStorage.setItem('openskyCreds', JSON.stringify({ username: user, password: pass }))
    localStorage.setItem('perf', JSON.stringify({ showProjections, maxMarkers: Number(maxMarkers) || 1000 }))
    localStorage.setItem('mode', localMode)
    localStorage.setItem('aviationstack_key', avKey)
    localStorage.setItem('demo_mode', demoMode ? '1' : '0')
    localStorage.setItem('provider', provider)
    onModeChange?.(localMode)
    alert('Settings saved')
  }

  return (
    <div className="settings">
      <div className="row">
        <div>
          <label>Data Mode</label>
          <select value={localMode} onChange={e=>setLocalMode(e.target.value)}>
            <option value="world">World (no bounds)</option>
            <option value="viewport">Viewport (map area)</option>
            <option value="custom">Custom (inputs below)</option>
          </select>
        </div>
        <div>
          <label>Polling (ms)</label>
          <input value={intervalMs} onChange={e=>onIntervalChange(parseInt(e.target.value||'0',10))} />
        </div>
      </div>

      <div className="row">
        <div>
          <label>Min Lat</label>
          <input value={minLat} onChange={e=>setMinLat(e.target.value)} disabled={localMode!=='custom'} />
        </div>
        <div>
          <label>Max Lat</label>
          <input value={maxLat} onChange={e=>setMaxLat(e.target.value)} disabled={localMode!=='custom'} />
        </div>
      </div>
      <div className="row">
        <div>
          <label>Min Lon</label>
          <input value={minLon} onChange={e=>setMinLon(e.target.value)} disabled={localMode!=='custom'} />
        </div>
        <div>
          <label>Max Lon</label>
          <input value={maxLon} onChange={e=>setMaxLon(e.target.value)} disabled={localMode!=='custom'} />
        </div>
      </div>

      <div className="row">
        <div>
          <label>OpenSky User</label>
          <input value={user} onChange={e=>setUser(e.target.value)} />
        </div>
        <div>
          <label>OpenSky Password</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} />
        </div>
      </div>

      <div className="row">
        <div>
          <label>Provider</label>
          <select value={provider} onChange={e=>setProvider(e.target.value)}>
            <option value="opensky">OpenSky Network</option>
            <option value="airplanes">Airplanes.Live</option>
          </select>
        </div>
      </div>

      <div className="row">
        <div>
          <label>AviationStack Key</label>
          <input placeholder="optional for routes" value={avKey} onChange={e=>setAvKey(e.target.value)} />
        </div>
      </div>

      <div className="row" style={{marginTop: 8}}>
        <div>
          <label>Show Projections</label>
          <input type="checkbox" checked={showProjections} onChange={e=>setShowProjections(e.target.checked)} />
        </div>
        <div>
          <label>Max Markers</label>
          <input value={maxMarkers} onChange={e=>setMaxMarkers(e.target.value)} />
        </div>
      </div>

      <div className="row" style={{marginTop: 8}}>
        <div>
          <label>Offline Demo</label>
          <input type="checkbox" checked={demoMode} onChange={e=>setDemoMode(e.target.checked)} />
        </div>
        <div style={{alignSelf:'end', color:'#7b879a', fontSize:12}}>Show simulated aircraft when OpenSky is blocked.</div>
      </div>

      <div style={{marginTop: 8}}>
        <button className="btn" onClick={save}>Save</button>
      </div>
    </div>
  )
}