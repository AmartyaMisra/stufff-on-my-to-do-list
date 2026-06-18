from datetime import datetime
from typing import List, Dict, Any
import math
import numpy as np


def deg_to_rad(degrees: float) -> float:
    """Convert degrees to radians"""
    return math.radians(degrees)


def rad_to_deg(radians: float) -> float:
    """Convert radians to degrees"""
    return math.degrees(radians)


def calculate_angular_separation(ra1: float, dec1: float, ra2: float, dec2: float) -> float:
    """
    Calculate angular separation between two points on the sky in degrees
    
    Uses the haversine formula for spherical distance
    """
    if ra1 is None or dec1 is None or ra2 is None or dec2 is None:
        return float('inf')
    
    ra1_rad = deg_to_rad(ra1)
    dec1_rad = deg_to_rad(dec1)
    ra2_rad = deg_to_rad(ra2)
    dec2_rad = deg_to_rad(dec2)
    
    d_ra = ra2_rad - ra1_rad
    d_dec = dec2_rad - dec1_rad
    
    a = math.sin(d_dec / 2)**2 + math.cos(dec1_rad) * math.cos(dec2_rad) * math.sin(d_ra / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return rad_to_deg(c)


def format_timestamp(timestamp: datetime, format_str: str = "%Y-%m-%d %H:%M:%S UTC") -> str:
    """Format a datetime object as a string"""
    return timestamp.strftime(format_str)


def calculate_statistics(values: List[float]) -> Dict[str, float]:
    """
    Calculate basic statistics for a list of values
    
    Returns:
        Dictionary with mean, std, min, max, median
    """
    if not values:
        return {
            "mean": 0.0,
            "std": 0.0,
            "min": 0.0,
            "max": 0.0,
            "median": 0.0
        }
    
    arr = np.array(values)
    return {
        "mean": float(np.mean(arr)),
        "std": float(np.std(arr)),
        "min": float(np.min(arr)),
        "max": float(np.max(arr)),
        "median": float(np.median(arr))
    }


def normalize_confidence(score: float, min_score: float = 0.0, max_score: float = 1.0) -> float:
    """Normalize a confidence score to [0, 1] range"""
    if max_score == min_score:
        return 0.0
    normalized = (score - min_score) / (max_score - min_score)
    return max(0.0, min(1.0, normalized))


def calculate_distance_3d(x1: float, y1: float, z1: float, x2: float, y2: float, z2: float) -> float:
    """Calculate 3D Euclidean distance"""
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2 + (z2 - z1)**2)

