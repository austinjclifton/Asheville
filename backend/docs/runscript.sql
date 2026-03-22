BEGIN;

TRUNCATE TABLE
  password_reset_token,
  session,
  external_condition,
  reading,
  device,
  hive,
  location,
  beekeeper
RESTART IDENTITY CASCADE;

INSERT INTO beekeeper (username, password_hash, email, phone, created_at, updated_at)
VALUES
  (
    'austin',
    '$2b$10$vOxue/PRvHwjUVoWiBLjV.v8PldNIXctabF/122DuBh4wRw/6uREW',
    'austin@example.com',
    '585-555-0101',
    now(),
    now()
  );

INSERT INTO location (name, lat, lon, created_at, updated_at)
VALUES
  (
    'Henrietta, NY',
    43.0387,
    -77.6122,
    now(),
    now()
  );

INSERT INTO hive (beekeeper_id, location_id, name, notes, created_at, updated_at)
VALUES
  (
    1,
    1,
    'Austin Hive 1',
    'Primary hive',
    now(),
    now()
  ),
  (
    1,
    1,
    'Austin Hive 2',
    'Secondary hive',
    now(),
    now()
  );

INSERT INTO device (hive_id, installed_at, last_seen_at, created_at, updated_at)
VALUES
  (
    1,
    '2026-02-17 09:00:00-05',
    NULL,
    now(),
    now()
  ),
  (
    2,
    '2026-02-17 09:05:00-05',
    NULL,
    now(),
    now()
  );

WITH daily AS (
  SELECT
    gs::date AS day_date,
    ROW_NUMBER() OVER (ORDER BY gs) - 1 AS day_num,
    ((gs::timestamp + time '14:00') AT TIME ZONE 'America/New_York') AS bucket_at
  FROM generate_series('2026-02-17'::date, '2026-03-19'::date, interval '1 day') AS gs
)
INSERT INTO external_condition (
  location_id,
  bucket_at,
  fetched_at,
  provider,
  status,
  error_message,
  temperature,
  humidity_pct,
  precip_mm,
  wind_mps,
  wind_gust_mps,
  pressure_hpa,
  cloud_pct,
  raw_json,
  created_at,
  updated_at
)
SELECT
  1,
  d.bucket_at,
  d.bucket_at + interval '7 minutes',
  'openweather',
  'success',
  NULL,
  ROUND((28.0 + d.day_num * 0.42 + 7.5 * sin(d.day_num / 3.2))::numeric, 1),
  ROUND((62.0 + 14.0 * sin(d.day_num / 2.7))::numeric, 1),
  CASE
    WHEN d.day_num IN (2, 5, 9, 14, 18, 23, 27, 30)
      THEN ROUND((1.2 + abs(sin(d.day_num)) * 4.3)::numeric, 1)
    ELSE 0.0
  END,
  ROUND((2.8 + abs(sin(d.day_num / 1.9)) * 4.7)::numeric, 1),
  ROUND((4.4 + abs(cos(d.day_num / 2.1)) * 6.3)::numeric, 1),
  ROUND((1008.0 + 9.0 * cos(d.day_num / 4.6))::numeric, 1),
  ROUND((46.0 + 30.0 * abs(sin(d.day_num / 2.3)))::numeric, 1),
  jsonb_build_object(
    'unit', 'F',
    'date', d.day_date,
    'source', 'seed'
  ),
  now(),
  now()
FROM daily d
ORDER BY d.bucket_at;

WITH daily AS (
  SELECT
    gs::date AS day_date,
    ROW_NUMBER() OVER (ORDER BY gs) - 1 AS day_num,
    ((gs::timestamp + time '14:00') AT TIME ZONE 'America/New_York') AS bucket_at
  FROM generate_series('2026-02-17'::date, '2026-03-19'::date, interval '1 day') AS gs
)
INSERT INTO reading (
  device_id,
  bucket_at,
  received_at,
  temperature,
  rssi,
  created_at
)
SELECT
  1,
  d.bucket_at,
  d.bucket_at + interval '2 minutes',
  ROUND((33.4 + 1.0 * sin(d.day_num / 4.1) - 0.03 * GREATEST(0, 40 - (28.0 + d.day_num * 0.42 + 7.5 * sin(d.day_num / 3.2))))::numeric, 1),
  (-86 + (d.day_num % 4))::smallint,
  d.bucket_at + interval '2 minutes'
FROM daily d
UNION ALL
SELECT
  2,
  d.bucket_at,
  d.bucket_at + interval '3 minutes',
  ROUND((32.8 + 1.1 * sin((d.day_num + 1) / 4.0) - 0.03 * GREATEST(0, 40 - (28.0 + d.day_num * 0.42 + 7.5 * sin(d.day_num / 3.2))))::numeric, 1),
  (-89 + (d.day_num % 5))::smallint,
  d.bucket_at + interval '3 minutes'
FROM daily d
ORDER BY 1, 2;

UPDATE device
SET
  last_seen_at = latest.max_bucket,
  updated_at = now()
FROM (
  SELECT device_id, MAX(bucket_at) AS max_bucket
  FROM reading
  GROUP BY device_id
) AS latest
WHERE latest.device_id = device.id;

COMMIT;