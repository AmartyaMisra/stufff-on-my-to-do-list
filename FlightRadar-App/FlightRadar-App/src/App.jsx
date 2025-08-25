import React, { useMemo, useState, useCallback, useEffect } from 'react'
import MapView from './components/Map'
import Settings from './components/Settings'
import FlightSidebar from './components/FlightSidebar'
import { useFlights } from './state/useFlights'

export default function App() {
	const { flights: flightsObj, rawCount, status, intervalMs, setIntervalMs, forceRefresh, mode, setMode, bbox, setBbox } = useFlights()

	// Convert object flights → array-of-arrays shape expected by MapView/FlightSidebar
	const flights = useMemo(() => {
		return (flightsObj || []).map(f => ([
			f.icao24,
			f.callsign,
			f.origin_country,
			f.time_position,
			f.last_contact,
			f.longitude,
			f.latitude,
			f.baro_altitude,
			f.on_ground,
			f.velocity,
			f.true_track,
			f.vertical_rate,
			null,
			f.geo_altitude,
			f.squawk,
			f.spi,
			f.position_source
		]))
	}, [flightsObj])

	const [perf, setPerf] = useState({ showProjections: true, maxMarkers: 10000 })
	const [selectedFlight, setSelectedFlight] = useState(null) // icao24
	const [routeInfo, setRouteInfo] = useState({})

	const onViewportChange = useCallback((b) => { setBbox(b) }, [])

	const requestRoute = useCallback((_callsign, _icao24) => {
		// Placeholder: previous implementation used external API; keep no-op to maintain UI
		setRouteInfo({ from: '', to: '', airline: '', status: 'idle' })
	}, [])

	// Clock for header
	const [now, setNow] = useState(new Date())
	useEffect(() => {
		const t = setInterval(() => setNow(new Date()), 1000)
		return () => clearInterval(t)
	}, [])

	return (
		<div className="app-shell">
			<div className="topbar">
				<div className="brand">
					<div className="dot" />
					<div className="title">FlightRadar • 24×7</div>
					<span className="badge green">{flights.length} aircraft</span>
					<span className="badge">raw {rawCount}</span>
				</div>
				<div className="controls">
					{status.loading ? <span className="badge">Updating…</span> : null}
					{status.error ? <span className="badge" style={{ color: 'tomato' }}>OpenSky: {status.error}</span> : null}
					<span className="badge">{now.toLocaleTimeString()}</span>
					<button className="btn" onClick={forceRefresh} disabled={status.loading}>Fetch Now</button>
					<button className="btn" onClick={() => window.location.reload()}>Reload</button>
				</div>
			</div>

			<div className="content">
				<div className="sidebar">
					<div className="panel">
						<div className="panel-header">Settings</div>
						<div className="card">
							<Settings
								bbox={bbox}
								onBboxChange={setBbox}
								intervalMs={intervalMs}
								onIntervalChange={setIntervalMs}
								onPerfChange={setPerf}
								mode={mode}
								onModeChange={setMode}
							/>
							<div className="footer-note">Source: OpenSky Network REST. Add credentials for better rate limits.</div>
						</div>
					</div>
				</div>

				<div className="maparea">
					<MapView
						flights={flights}
						onViewportChange={onViewportChange}
						initialBbox={bbox}
						onSelectFlight={(f) => setSelectedFlight(f?.[0] || null)}
						selectedFlight={flights.find(f => f[0] === selectedFlight) || null}
						showProjections={perf.showProjections}
					/>
				</div>

				<div className="rightbar">
					<FlightSidebar
						flights={flights}
						selectedFlight={selectedFlight}
						onSelect={setSelectedFlight}
						routeInfo={routeInfo}
						onRequestRoute={requestRoute}
					/>
				</div>
			</div>
		</div>
	)
}
