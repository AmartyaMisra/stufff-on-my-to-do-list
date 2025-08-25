// Airplanes.Live provider
// Docs: https://api.airplanes.live/

function buildPositionsUrl(bb) {
  const p = new URL('https://api.airplanes.live/v2/positions')
  p.searchParams.set('bbox', `${bb.minLat},${bb.minLon},${bb.maxLat},${bb.maxLon}`)
  return p.toString()
}

function knotsToMs(knots) {
  return knots == null ? null : (knots * 0.514444)
}

async function fetchTile(bb, signal) {
  const url = buildPositionsUrl(bb)
  const res = await fetch(url, { signal })
  if (!res.ok) {
    // Some regions or too-large bboxes may 404; return empty but with hint
    return { aircraft: [], now: Math.floor(Date.now() / 1000), error: `HTTP ${res.status}` }
  }
  const data = await res.json()
  return data
}

function splitIntoTiles(bbox, maxTileSpan = 20, maxTiles = 16) {
  const tiles = []
  const latSpan = Math.max(0.0001, bbox.maxLat - bbox.minLat)
  const lonSpan = Math.max(0.0001, bbox.maxLon - bbox.minLon)
  const latStep = Math.min(maxTileSpan, latSpan)
  const lonStep = Math.min(maxTileSpan, lonSpan)
  for (let lat = bbox.minLat; lat < bbox.maxLat && tiles.length < maxTiles; lat += latStep) {
    const lat2 = Math.min(lat + latStep, bbox.maxLat)
    for (let lon = bbox.minLon; lon < bbox.maxLon && tiles.length < maxTiles; lon += lonStep) {
      const lon2 = Math.min(lon + lonStep, bbox.maxLon)
      tiles.push({ minLat: lat, minLon: lon, maxLat: lat2, maxLon: lon2 })
    }
  }
  return tiles
}

export async function fetchAirplanesLive({ mode = 'world', bbox, signal } = {}) {
  const bb = bbox || { minLat: -85, minLon: -180, maxLat: 85, maxLon: 180 }
  const latSpan = bb.maxLat - bb.minLat
  const lonSpan = bb.maxLon - bb.minLon

  let data, list = [], now = Math.floor(Date.now() / 1000), anyError = null
  try {
    if (latSpan > 20 || lonSpan > 20) {
      const tiles = splitIntoTiles(bb, 20, 12)
      const results = await Promise.all(tiles.map(t => fetchTile(t, signal)))
      now = Math.floor(Date.now() / 1000)
      for (const r of results) {
        if (r?.error && !anyError) anyError = r.error
        if (Array.isArray(r?.aircraft)) list.push(...r.aircraft)
        if (r?.now) now = r.now
      }
    } else {
      data = await fetchTile(bb, signal)
      anyError = data?.error || null
      list = Array.isArray(data?.aircraft) ? data.aircraft : []
      now = data?.now || now
    }
  } catch (e) {
    return { flights: [], rawCount: 0, epoch: null, error: String(e?.message || e), nextInterval: 30000 }
  }

  // Map to OpenSky-like objects used by our app
  const mapped = list
    .filter(a => a.lat != null && a.lon != null)
    .map(a => ({
      icao24: a.hex,
      callsign: (a.flight || '').trim(),
      origin_country: a.country || a.r || '',
      time_position: now,
      last_contact: now,
      longitude: a.lon,
      latitude: a.lat,
      baro_altitude: a.alt_baro != null ? a.alt_baro * 0.3048 : (a.alt_geom != null ? a.alt_geom * 0.3048 : null),
      on_ground: !!a.gs && a.gs < 30,
      velocity: knotsToMs(a.gs),
      true_track: a.track,
      vertical_rate: a.baro_rate != null ? a.baro_rate * 0.00508 : (a.geom_rate != null ? a.geom_rate * 0.00508 : null),
      geo_altitude: a.alt_geom != null ? a.alt_geom * 0.3048 : null,
      squawk: a.squawk || null,
      spi: false,
      position_source: 0,
    }))

  const rawCount = list.length
  const nextInterval = rawCount < 50 ? 30000 : 15000
  return { flights: mapped, rawCount, epoch: now, error: anyError, nextInterval }
}



