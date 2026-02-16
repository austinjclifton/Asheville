"use strict";

/**
 * readings repo function index
 *
 * Ingest
 * - createReading(payload): Insert a reading for a device (ingest-only; relies on DB constraints)
 *
 * Hive Reads (dashboard-facing)
 * - getHiveReadingsSince(params): Time-series readings for a hive since (and optional until)
 * - getLatestForHive(params): Latest reading row across a hive
 *
 * Daily Aggregates (future)
 * - getHiveDailySince(params): STUB — daily aggregate series for a hive since (and optional until)
 * - getLatestDailyForHive(params): STUB — latest daily aggregate row for a hive
 *
 * - notes
 * - This repo assumes inputs are validated/normalized by the service layer
 * - Ownership is enforced in SQL via joins: beekeeper -> hive -> device -> reading
 */

const { query } = require("./pool");

/* ========================================================================== */
/* helpers (ai-generated)                                                     */
/* ========================================================================== */

function mapPgError(err) {
  // Unique violation (e.g., uq_reading_device_recorded_at)
  if (err?.code === "23505") {
    const e = new Error("Duplicate reading");
    e.status = 409;
    e.code = "DUPLICATE_READING";
    return e;
  }

  // Foreign key violation (device_id doesn't exist)
  if (err?.code === "23503") {
    const e = new Error("Device does not exist");
    e.status = 400;
    e.code = "DEVICE_NOT_FOUND";
    return e;
  }

  // Check constraint violation (temperature/battery checks)
  if (err?.code === "23514") {
    const e = new Error("Invalid reading values");
    e.status = 400;
    e.code = "INVALID_READING";
    return e;
  }

  // Numeric value out of range / invalid cast etc.
  if (err?.code === "22003" || err?.code === "22P02") {
    const e = new Error("Invalid reading values");
    e.status = 400;
    e.code = "INVALID_READING";
    return e;
  }

  return null;
}

/**
 * ORDER BY keyword cannot be parameterized.
 * Service should pass "asc"/"desc" or "ASC"/"DESC".
 */
function toOrderSql(order) {
  const o = String(order || "asc").toLowerCase();
  if (o === "asc") return "ASC";
  if (o === "desc") return "DESC";
  // If service is correct, we never hit this.
  // Still guard to avoid accidental injection through order.
  return "ASC";
}

/* ========================================================================== */
/* ============================= INGEST LAYER =============================== */
/* ========================================================================== */

/**
 * createReading
 *
 * Used ONLY by ingest service.
 * Does not enforce beekeeper ownership (ingest auth should gate this).
 *
 * Expected normalized inputs:
 * - deviceId: integer
 * - recordedAt: Date
 * - temperatureF: number
 */
exports.createReading = async ({
  deviceId,
  recordedAt,
  temperatureF,
  batteryVoltage = null,
  signalStrength = null,
}) => {
  try {
    const rows = await query(
      `
      INSERT INTO reading (
        device_id,
        recorded_at,
        temperature_f,
        battery_voltage,
        signal_strength
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, device_id, recorded_at, created_at
      `,
      [deviceId, recordedAt, temperatureF, batteryVoltage, signalStrength]
    );

    return rows[0];
  } catch (err) {
    const mapped = mapPgError(err);
    if (mapped) throw mapped;
    throw err;
  }
};

/* ========================================================================== */
/* ============================ DASHBOARD LAYER ============================= */
/* ========================================================================== */

/**
 * getHiveReadingsSince
 *
 * Time-series readings for a hive since (optional until).
 *
 * Expected normalized inputs:
 * - beekeeperId: integer
 * - hiveId: integer
 * - since: Date
 * - until: Date | null (exclusive upper bound)
 * - limit: integer
 * - order: "asc" | "desc"
 *
 * Recommended indexes:
 * - device(hive_id)
 * - reading(device_id, recorded_at DESC)
 */
exports.getHiveReadingsSince = async ({
  beekeeperId,
  hiveId,
  since,
  until = null,
  limit,
  order = "asc",
}) => {
  const orderSql = toOrderSql(order);

  const rows = await query(
    `
    SELECT
      r.id,
      r.device_id,
      r.recorded_at,
      r.temperature_f,
      r.battery_voltage,
      r.signal_strength,
      r.created_at
    FROM hive h
    JOIN device d ON d.hive_id = h.id
    JOIN reading r ON r.device_id = d.id
    WHERE h.beekeeper_id = $1
      AND h.id = $2
      AND r.recorded_at >= $3
      AND ($4::timestamptz IS NULL OR r.recorded_at < $4::timestamptz)
    ORDER BY r.recorded_at ${orderSql}
    LIMIT $5
    `,
    [beekeeperId, hiveId, since, until, limit]
  );

  return rows;
};

/**
 * getLatestForHive
 *
 * Latest reading across the hive (single newest reading among all devices).
 */
exports.getLatestForHive = async ({ beekeeperId, hiveId }) => {
  const rows = await query(
    `
    SELECT
      r.id,
      r.device_id,
      r.recorded_at,
      r.temperature_f,
      r.battery_voltage,
      r.signal_strength,
      r.created_at
    FROM hive h
    JOIN device d ON d.hive_id = h.id
    JOIN reading r ON r.device_id = d.id
    WHERE h.beekeeper_id = $1
      AND h.id = $2
    ORDER BY r.recorded_at DESC
    LIMIT 1
    `,
    [beekeeperId, hiveId]
  );

  return rows[0] || null;
};

/* ========================================================================== */
/* ========================== DAILY AGGREGATES (STUBS) ====================== */
/* ========================================================================== */

/**
 * getHiveDailySince (STUB)
 *
 * Future: query a daily rollup table (e.g., reading_daily) that stores one row per hive per day,
 * such as min/max/avg temperature and reading_count.
 *
 * Expected future schema idea:
 * - reading_daily(hive_id, day_date, avg_temp_f, min_temp_f, max_temp_f, reading_count, ...)
 *
 * For now, this is intentionally not implemented to avoid expensive GROUP BY on raw readings.
 */
exports.getHiveDailySince = async () => {
  const e = new Error("Daily aggregates not implemented");
  e.status = 501;
  e.code = "NOT_IMPLEMENTED";
  throw e;
};

/**
 * getLatestDailyForHive (STUB)
 *
 * Future: latest daily rollup row for the hive.
 */
exports.getLatestDailyForHive = async () => {
  const e = new Error("Daily aggregates not implemented");
  e.status = 501;
  e.code = "NOT_IMPLEMENTED";
  throw e;
};
