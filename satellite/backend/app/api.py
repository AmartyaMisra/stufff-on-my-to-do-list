import json
import uuid
import os
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Body
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from .tasks import (
    run_frb_task,
    run_lc_task,
    run_sw_task,
    run_gw_task,
    run_neutrino_task,
    run_tle_task,
)
from .db import get_session

router = APIRouter()


@router.get("/events")
async def list_events(
    limit: int = 50,
    offset: int = 0,
    channel: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    query = "SELECT id, channel, event_time, score, payload FROM events"
    params = {}
    if channel:
        query += " WHERE channel = :channel"
        params["channel"] = channel
    query += " ORDER BY event_time DESC LIMIT :limit OFFSET :offset"
    params["limit"] = limit
    params["offset"] = offset
    rows = (await session.execute(text(query), params)).mappings().all()
    return {"events": [dict(r) for r in rows]}


@router.get("/events/{event_id}")
async def get_event(event_id: str, session: AsyncSession = Depends(get_session)):
    row = (
        await session.execute(
            text("SELECT id, channel, event_time, score, payload FROM events WHERE id = :id"),
            {"id": event_id},
        )
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    return dict(row)


@router.post("/ingest/chime")
async def ingest_chime(meta: str = Form(...), waterfall: UploadFile = File(...)):
    m = json.loads(meta)
    fname = f"radio/raw/{uuid.uuid4().hex}.npy"
    full = os.path.join("/data", fname)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    content = await waterfall.read()
    with open(full, "wb") as f:
        f.write(content)
    run_frb_task.delay(m, full)
    return JSONResponse({"status": "ok", "ingest_id": fname})


@router.post("/ingest/lightcurve")
async def ingest_lightcurve(payload: dict = Body(...)):
    times = []
    flux = []
    if "lightcurve" in payload:
        for t, f in payload["lightcurve"]:
            times.append(t)
            flux.append(f)
    run_lc_task.delay(payload, times, flux)
    return {"status": "ok"}


@router.post("/ingest/noaa")
async def ingest_noaa(payload: dict = Body(...)):
    run_sw_task.delay(payload, [])
    return {"status": "ok"}


@router.post("/ingest/gw")
async def ingest_gw(payload: dict = Body(...)):
    run_gw_task.delay(payload)
    return {"status": "ok"}


@router.post("/ingest/neutrino")
async def ingest_neutrino(payload: dict = Body(...)):
    run_neutrino_task.delay(payload)
    return {"status": "ok"}


@router.post("/ingest/tle")
async def ingest_tle(tle_body: str = Body(..., media_type="text/plain")):
    run_tle_task.delay(tle_body, [])
    return {"status": "ok"}

