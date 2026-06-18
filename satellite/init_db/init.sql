-- Enable extensions
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_time timestamptz NOT NULL,
  score double precision,
  payload jsonb,
  raw_ref text,
  UNIQUE(channel, id)
);

SELECT create_hypertable('events', 'event_time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS frb_candidates (
  id uuid PRIMARY KEY REFERENCES events(id),
  ra double precision,
  dec double precision,
  dm double precision,
  snr double precision,
  width_ms double precision
);

CREATE TABLE IF NOT EXISTS lc_events (
  id uuid PRIMARY KEY REFERENCES events(id),
  target_id text,
  period_days double precision,
  depth_ppm double precision,
  bls_power double precision
);

CREATE TABLE IF NOT EXISTS gw_events (
  id uuid PRIMARY KEY REFERENCES events(id),
  ivorn text,
  far double precision,
  snr double precision,
  skymap jsonb
);

CREATE TABLE IF NOT EXISTS neutrino_events (
  id uuid PRIMARY KEY REFERENCES events(id),
  ra double precision,
  dec double precision,
  radius_deg double precision,
  energy_teV double precision,
  significance double precision
);

CREATE TABLE IF NOT EXISTS tle_events (
  id uuid PRIMARY KEY REFERENCES events(id),
  norad_id int,
  name text,
  mean_motion double precision,
  sma double precision,
  anomaly_type text
);

CREATE TABLE IF NOT EXISTS sw_metrics (
  id serial PRIMARY KEY,
  ts timestamptz NOT NULL DEFAULT now(),
  source text,
  solar_wind_speed double precision,
  density double precision,
  bz_gsm double precision,
  proton_flux double precision,
  meta jsonb
);
SELECT create_hypertable('sw_metrics', 'ts', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS localizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id),
  geom geometry(PolygonZ, 4326),
  prob_density double precision,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_channel_time ON events(channel, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_frb_dm ON frb_candidates(dm);
CREATE INDEX IF NOT EXISTS idx_gw_far ON gw_events(far);
CREATE INDEX IF NOT EXISTS idx_sw_ts ON sw_metrics(ts DESC);

