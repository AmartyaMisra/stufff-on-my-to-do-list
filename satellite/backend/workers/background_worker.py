from celery import Celery
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from database.models import get_db, Event
from detection import (
    radio_detector,
    lightcurve_detector,
    spaceweather_detector,
    gw_detector,
    neutrino_detector,
    tle_detector
)
from fusion.event_fusion import fuse_events
from config import settings

# Initialize Celery
celery_app = Celery(
    "space_anomaly_radar",
    broker=settings.redis_url,
    backend=settings.redis_url
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


class BackgroundWorker:
    """Background worker for processing events and running detection"""
    
    @staticmethod
    @celery_app.task
    def process_event_detection(event_id: int):
        """Process anomaly detection for a single event"""
        db = next(get_db())
        try:
            event = db.query(Event).filter(Event.id == event_id).first()
            if not event:
                return {"status": "error", "message": "Event not found"}
            
            # Route to appropriate detector
            detectors = {
                "frb": radio_detector.RadioDetector,
                "lightcurve": lightcurve_detector.LightcurveDetector,
                "spaceweather": spaceweather_detector.SpaceWeatherDetector,
                "gw": gw_detector.GWDetector,
                "neutrino": neutrino_detector.NeutrinoDetector,
                "tle": tle_detector.TLEDetector
            }
            
            detector_class = detectors.get(event.event_type)
            if not detector_class:
                return {"status": "error", "message": f"Unknown event type: {event.event_type}"}
            
            anomaly = detector_class.detect(event, db)
            return {
                "status": "success",
                "event_id": event_id,
                "anomaly_id": anomaly.id,
                "severity": anomaly.severity
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
    
    @staticmethod
    @celery_app.task
    def run_periodic_fusion():
        """Run event fusion on recent events"""
        db = next(get_db())
        try:
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(hours=24)
            
            fused_events = fuse_events(start_time, end_time, db)
            return {
                "status": "success",
                "fused_count": len(fused_events),
                "fused_event_ids": [fe.id for fe in fused_events]
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}
        finally:
            db.close()
    
    @staticmethod
    @celery_app.task
    def process_batch_detection(event_ids: list):
        """Process anomaly detection for multiple events"""
        results = []
        for event_id in event_ids:
            result = BackgroundWorker.process_event_detection.delay(event_id)
            results.append(result.id)
        return {"status": "success", "task_ids": results}


# Periodic task schedule
celery_app.conf.beat_schedule = {
    "run-fusion-every-hour": {
        "task": "workers.background_worker.BackgroundWorker.run_periodic_fusion",
        "schedule": 3600.0,  # Every hour
    },
}

