import os
import asyncio
from datetime import datetime, timezone
from celery import Celery
from sqlalchemy import text

from .detectors import frb_detector, lc_detector, sw_detector, gw_detector, neutrino_detector, tle_detector
from .db import AsyncSessionLocal

REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.task_routes = {"app.tasks.*": {"queue": "detectors"}}


async def _insert_event(channel: str, score: float, payload):
    async with AsyncSessionLocal() as session:
        await session.execute(
            text(
                "INSERT INTO events (channel, event_time, score, payload) "
                "VALUES (:channel, :event_time, :score, :payload)"
            ),
            {
                "channel": channel,
                "event_time": datetime.now(timezone.utc),
                "score": score,
                "payload": payload,
            },
        )
        await session.commit()


@celery_app.task()
def run_frb_task(meta, spectrogram_path):
    cands = frb_detector.run_frb_detection(meta, spectrogram_path)
    asyncio.run(
        asyncio.gather(
            *[_insert_event("frb", float(c.get("snr", 0.0)), c) for c in cands],
        )
    )
    return {"n_candidates": len(cands)}


@celery_app.task()
def run_lc_task(meta, times_list, flux_list):
    import numpy as np

    res = lc_detector.run_lightcurve_detection(meta, np.array(times_list), np.array(flux_list))
    score = float(res.get("bls_power", 0.0)) if "bls_power" in res else 0.0
    asyncio.run(_insert_event("lightcurve", score, res))
    return res


@celery_app.task()
def run_sw_task(sample, history):
    import pandas as pd

    triggers, df = sw_detector.process_sw_sample(sample, pd.DataFrame(history))
    score = max([t.get("z", 0) or t.get("delta", 0) for t in triggers], default=0.0)
    asyncio.run(_insert_event("space_weather", float(score), {"triggers": triggers}))
    return {"triggers": triggers, "history_len": len(df)}


@celery_app.task()
def run_gw_task(payload):
    res = gw_detector.evaluate_gw_alert(payload)
    asyncio.run(_insert_event("gw", float(res.get("score", 0.0)), payload))
    return res


@celery_app.task()
def run_neutrino_task(alert):
    res = neutrino_detector.score_neutrino(alert)
    asyncio.run(_insert_event("neutrino", float(res.get("score", 0.0)), alert))
    return res


@celery_app.task()
def run_tle_task(tle_text, history):
    res = tle_detector.analyze_tle(tle_text, history)
    score = 0.5
    if res.get("anomaly"):
        score = 0.9
    asyncio.run(_insert_event("tle", score, res))
    return res

