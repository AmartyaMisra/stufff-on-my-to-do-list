import React, { useMemo, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getCardinalDirection, metersToFeet, msToKmh } from '../utils/conversions.js'
import { getAirportCoords } from '../services/airports.js'

// Fix Leaflet's default marker icons in Vite
import marker2x from 'leaflet/dist/images/marker-icon-2x.png'
import marker from 'leaflet/dist/images/marker-icon.png'
import shadow from 'leaflet/dist/images/marker-shadow.png'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: shadow,
})

// Custom aircraft icon - clearer airplane silhouette
const createAircraftIcon = (heading, isSelected = false) => {
  const size = isSelected ? 26 : 20
  const color = isSelected ? '#00FFFF' : '#ff6b6b'
  return L.divIcon({
    className: 'aircraft-icon',
    html: `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${heading || 0}deg); display:block">
        <g fill="${color}" stroke="white" stroke-width="0.6">
          <path d="M12 2 L13.2 8 L18 10 L13.2 11.2 L12 22 L10.8 11.2 L6 10 L10.8 8 Z"/>
          <path d="M4 10.2 L12 9.2 L20 10.2 L12 11.2 Z"/>
          <path d="M9 14 L12 13.6 L15 14 L12 15 Z"/>
        </g>
      </svg>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

// geo helpers
const toRad = (deg) => (deg * Math.PI) / 180
const toDeg = (rad) => (rad * 180) / Math.PI
function projectForward(lat, lon, bearingDeg, distanceKm) {
  const R = 6371
  const brng = toRad(bearingDeg || 0)
  const d = distanceKm / R
  const lat1 = toRad(lat)
  const lon1 = toRad(lon)
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng))
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2))
  return [toDeg(lat2), ((toDeg(lon2) + 540) % 360) - 180]
}

function ViewportHandler({ onViewportChange }) {
  useMapEvents({
    moveend: (e) => {
      const m = e.target
      const b = m.getBounds()
      const sw = b.getSouthWest(); const ne = b.getNorthEast()
      onViewportChange?.({ minLat: sw.lat, maxLat: ne.lat, minLon: sw.lng, maxLon: ne.lng })
    }
  })
  return null
}

export default function MapView ({ flights, onViewportChange, initialBbox, onSelectFlight, selectedFlight, showProjections }) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [tileError, setTileError] = useState(false)

  const center = useMemo(() => {
    return [
      (initialBbox.minLat + initialBbox.maxLat) / 2,
      (initialBbox.minLon + initialBbox.maxLon) / 2
    ]
  }, [initialBbox])

  const zoom = useMemo(() => {
    const latDiff = initialBbox.maxLat - initialBbox.minLat
    const lonDiff = initialBbox.maxLon - initialBbox.minLon
    return Math.min(10, Math.max(3, 8 - Math.log2(Math.max(latDiff, lonDiff) / 10)))
  }, [initialBbox])

  const validFlights = useMemo(() => {
    return (flights || []).filter(f => f[5] !== null && f[6] !== null)
  }, [flights])

  const tileServers = [
    {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c']
    },
    {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: ['a', 'b', 'c', 'd']
    },
    {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: []
    }
  ]

  const currentTileServer = tileError ? tileServers[1] : tileServers[0]

  useEffect(() => {
    const timer = setTimeout(() => { setMapLoaded(true) }, 1200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {!mapLoaded && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, background: 'rgba(0,0,0,0.8)', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          Loading map...
        </div>
      )}

      <MapContainer
        center={center}
        zoom={zoom}
        className="leaflet-container"
        style={{ height: '100%', width: '100%' }}
        whenCreated={(map) => {
          setMapLoaded(true)
          map.on('tileerror', () => { setTileError(true) })
          setTimeout(() => { map.invalidateSize() }, 100)
        }}
        preferCanvas={true}
      >
        <TileLayer
          url={currentTileServer.url}
          attribution={currentTileServer.attribution}
          maxZoom={18}
          subdomains={currentTileServer.subdomains}
          errorTileUrl="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        />
        <ViewportHandler onViewportChange={onViewportChange} />

        {validFlights.map((f, idx) => {
          const icao24 = f[0]
          const callsign = f[1] || '—'
          const country = f[2] || '—'
          const lon = f[5]
          const lat = f[6]
          const baroAlt = f[7]
          const velocity = f[9]
          const heading = f[10]
          const vertRate = f[11]
          const route = f[17]

          const isCurrentSelected = selectedFlight && (selectedFlight[0] === icao24)

          // Projected path (1 min)
          let projectedPath = []
          if (showProjections && velocity && heading && validFlights.length < 2000) {
            const distanceKm = (velocity * 60) / 1000
            const [plat, plon] = projectForward(lat, lon, heading, distanceKm)
            projectedPath = [[lat, lon], [plat, plon]]
          }

          // Route or forward segment
          let fullRoutePath = []
          if (route && route.departure && route.arrival) {
            const dep = getAirportCoords(route.departure)
            const arr = getAirportCoords(route.arrival)
            if (dep && arr) fullRoutePath = [[dep[0], dep[1]], [arr[0], arr[1]]]
          } else if (heading != null) {
            const [flat2, flon2] = projectForward(lat, lon, heading, 1200)
            fullRoutePath = [[lat, lon], [flat2, flon2]]
          }

          return (
            <React.Fragment key={`${icao24}-${idx}`}>
              <Marker
                position={[lat, lon]}
                icon={createAircraftIcon(heading, isCurrentSelected)}
                eventHandlers={{ click: () => onSelectFlight && onSelectFlight(f) }}
              >
                <Popup>
                  <div style={{ fontSize: 12, fontFamily: 'system-ui, sans-serif', minWidth: '150px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{(callsign || '').trim() || 'Unknown'}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px' }}>
                      <span>ICAO24:</span><span>{icao24}</span>
                      <span>Origin:</span><span>{country}</span>
                      <span>Altitude:</span><span>{baroAlt != null ? `${Math.round(metersToFeet(baroAlt))} ft (${Math.round(baroAlt)} m)` : '—'}</span>
                      <span>Speed:</span><span>{velocity != null ? `${Math.round(msToKmh(velocity))} km/h` : '—'}</span>
                      <span>Heading:</span><span>{heading != null ? `${Math.round(heading)}° ${getCardinalDirection(heading)}` : '—'}</span>
                      <span>Climb:</span><span>{vertRate != null ? `${Math.round(vertRate)} m/s` : '—'}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {showProjections && projectedPath.length > 0 && (
                <Polyline positions={projectedPath} color="yellow" dashArray="5, 10" weight={1} opacity={0.6} />
              )}

              {fullRoutePath.length > 0 && (
                <Polyline positions={fullRoutePath} color="#87CEEB" dashArray="3, 3" weight={1} opacity={0.3} />
              )}
            </React.Fragment>
          )
        })}
      </MapContainer>
    </div>
  )
}
