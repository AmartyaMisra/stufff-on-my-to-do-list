import pandas as pd
from typing import Dict, Any, Tuple, List


def process_sw_sample(sample: Dict[str, Any], window_history: pd.DataFrame) -> Tuple[List[Dict[str, Any]], pd.DataFrame]:
    df = window_history.copy()
    df = pd.concat([df, pd.DataFrame([sample])], ignore_index=True)
    df = df.tail(120)  # keep last ~120 samples

    df["speed_mean"] = df["solar_wind_speed"].rolling(60, min_periods=5).mean()
    df["speed_std"] = df["solar_wind_speed"].rolling(60, min_periods=5).std()
    df["speed_z"] = (df["solar_wind_speed"] - df["speed_mean"]) / (df["speed_std"] + 1e-9)

    latest = df.iloc[-1]
    triggers: List[Dict[str, Any]] = []
    if abs(latest.get("speed_z", 0)) > 3:
        triggers.append({"metric": "solar_wind_speed", "z": float(latest.speed_z)})
    if len(df) > 10:
        delta_speed = df["solar_wind_speed"].iloc[-1] - df["solar_wind_speed"].iloc[-10]
        if delta_speed > 200:
            triggers.append({"metric": "solar_wind_speed", "delta": float(delta_speed)})
    return triggers, df

