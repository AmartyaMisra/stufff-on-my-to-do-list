export async function fetchFlights() {
  try {
    const response = await fetch("https://opensky-network.org/api/states/all");
    if (!response.ok) throw new Error("OpenSky request failed");

    const data = await response.json();

    // Defensive check: return empty if nothing
    if (!data || !data.states) return [];

    // Map raw OpenSky array -> clean objects
    return data.states.map(flight => ({
      icao24: flight[0],
      callsign: flight[1]?.trim() || "N/A",
      origin_country: flight[2],
      time_position: flight[3],
      last_contact: flight[4],
      longitude: flight[5],
      latitude: flight[6],
      baro_altitude: flight[7],
      on_ground: flight[8],
      velocity: flight[9],
      true_track: flight[10],
      vertical_rate: flight[11],
      geo_altitude: flight[13],
      squawk: flight[14],
      spi: flight[15],
      position_source: flight[16],
    }));
  } catch (err) {
    console.error("❌ Flight fetch error:", err);
    return [];
  }
}
