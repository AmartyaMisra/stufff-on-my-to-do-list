import React, { useEffect, useMemo, useState } from 'react'

function useFlightChat(icao24) {
  const [messages, setMessages] = useState([])
  useEffect(() => {
    const raw = localStorage.getItem('chat:'+icao24)
    setMessages(raw ? JSON.parse(raw) : [])
  }, [icao24])
  const send = (text) => {
    const msg = { id: Date.now(), text, ts: new Date().toISOString() }
    const next = [...messages, msg]
    setMessages(next)
    localStorage.setItem('chat:'+icao24, JSON.stringify(next))
  }
  return { messages, send }
}

function extractICAO(s) {
  if (!s || typeof s !== 'string') return null
  const m = s.match(/\b[A-Z]{4}\b/)
  return m ? m[0] : null
}

export default function FlightSidebar({ flights, selectedFlight, onSelect, routeInfo, onRequestRoute }) {
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [atcUrl, setAtcUrl] = useState('https://www.liveatc.net')

  const list = useMemo(() => {
    const arr = flights.map(f => ({
      icao24: f[0],
      callsign: (f[1]||'').trim(),
      country: f[2],
      lon: f[5], lat: f[6], alt: f[7], spd: f[9], hdg: f[10], vr: f[11]
    }))
    const filtered = search ? arr.filter(x => x.callsign?.toLowerCase().includes(search.toLowerCase()) || x.icao24?.includes(search)) : arr
    return filtered.slice(0, 200).sort((a,b) => (b.spd||0) - (a.spd||0))
  }, [flights, search])

  const sel = useMemo(() => {
    if (!selectedFlight) return null
    const f = flights.find(x => x[0] === selectedFlight)
    if (!f) return null
    return {
      icao24: f[0], callsign: (f[1]||'').trim(), country: f[2],
      lon: f[5], lat: f[6], alt: f[7], spd: f[9], hdg: f[10], vr: f[11]
    }
  }, [selectedFlight, flights])

  const chat = useFlightChat(sel?.icao24 || 'none')

  const depIcao = extractICAO(routeInfo?.from)
  const arrIcao = extractICAO(routeInfo?.to)

  useEffect(() => {
    // Auto-update LiveATC search URL if ICAO known
    if (depIcao) setAtcUrl(`https://www.liveatc.net/search/?icao=${depIcao}`)
    else if (arrIcao) setAtcUrl(`https://www.liveatc.net/search/?icao=${arrIcao}`)
  }, [depIcao, arrIcao])

  return (
    <div className="flight-sidebar">
      <div className="panel">
        <div className="panel-header">Flights</div>
        <div className="panel-controls">
          <input placeholder="Search callsign/ICAO24" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flight-list">
          {list.map(f => (
            <div key={f.icao24} className={`flight-row ${selectedFlight===f.icao24?'sel':''}`} onClick={()=>onSelect?.(f.icao24)}>
              <div className="f-callsign">{f.callsign || 'Unknown'}</div>
              <div className="f-meta">{f.country} • {f.alt!=null?Math.round(f.alt):'—'} m • {f.spd!=null?Math.round(f.spd*3.6):'—'} km/h</div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">Details</div>
        <div className="details">
          {!sel ? <div className="muted">Select a flight</div> : (
            <>
              <div className="kv">
                <div>Callsign</div><div>{sel.callsign || 'Unknown'}</div>
                <div>ICAO24</div><div>{sel.icao24}</div>
                <div>Origin</div><div>{sel.country || '—'}</div>
                <div>Altitude</div><div>{sel.alt!=null?`${Math.round(sel.alt)} m`: '—'}</div>
                <div>Speed</div><div>{sel.spd!=null?`${Math.round(sel.spd*3.6)} km/h`: '—'}</div>
                <div>Heading</div><div>{sel.hdg!=null?`${Math.round(sel.hdg)}°`: '—'}</div>
              </div>
              <div className="route">
                <button className="btn small" onClick={()=>onRequestRoute?.(sel.callsign, sel.icao24)}>Lookup Route</button>
                {routeInfo?.status==='loading' && <div className="muted">Fetching route…</div>}
                {routeInfo?.from || routeInfo?.to ? (
                  <div className="kv" style={{marginTop:8}}>
                    <div>From</div><div>{routeInfo.from || '—'}</div>
                    <div>To</div><div>{routeInfo.to || '—'}</div>
                    {routeInfo.airline ? (<><div>Airline</div><div>{routeInfo.airline}</div></>) : null}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">Live ATC</div>
        <div className="details" style={{padding:10}}>
          <div style={{display:'flex',gap:6,marginBottom:6}}>
            <input style={{flex:1}} value={atcUrl} onChange={e=>setAtcUrl(e.target.value)} />
            <a className="btn small" href={atcUrl} target="_blank" rel="noopener noreferrer">Open</a>
          </div>
          <div style={{height:240,border:'1px solid #1b2138',borderRadius:6,overflow:'hidden'}}>
            <webview src={atcUrl} style={{width:'100%',height:'100%'}} allowpopups="true"></webview>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">Chat</div>
        {!sel ? <div className="muted" style={{padding:8}}>Select a flight to start chatting</div> : (
          <div className="chat">
            <div className="chat-messages">
              {chat.messages.map(m => (
                <div key={m.id} className="chat-msg"><span className="ts">{new Date(m.ts).toLocaleTimeString()}</span> {m.text}</div>
              ))}
            </div>
            <div className="chat-input">
              <input placeholder="Type a message…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && input.trim()){ chat.send(input.trim()); setInput('') } }} />
              <button className="btn small" onClick={()=>{ if(input.trim()){ chat.send(input.trim()); setInput('') } }}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
