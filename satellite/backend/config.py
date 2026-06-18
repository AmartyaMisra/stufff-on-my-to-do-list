from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database - defaults to SQLite for local development, can be overridden with env var
    database_url: str = "sqlite:///./space_anomaly.db"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    # Detection thresholds
    frb_anomaly_threshold: float = 0.7
    lightcurve_anomaly_threshold: float = 0.6
    spaceweather_anomaly_threshold: float = 0.65
    gw_anomaly_threshold: float = 0.75
    neutrino_anomaly_threshold: float = 0.7
    tle_anomaly_threshold: float = 0.6
    
    # Fusion parameters
    fusion_time_window_seconds: int = 300  # 5 minutes
    fusion_spatial_threshold_arcmin: float = 10.0  # 10 arcminutes
    fusion_min_confidence: float = 0.5
    
    # External APIs (optional)
    nasa_api_key: Optional[str] = None
    esa_api_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

