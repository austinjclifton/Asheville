"use strict";

/**
 * Readings Repository (PostgreSQL)
 * Table: reading
 *
 * Responsibilities:
 * - SQL only (no business rules)
 * - Parameterized queries only
 * - Enforce ownership for dashboard reads via joins:
 *   beekeeper -> hive -> device -> reading
 *
 * Notes:
 * - Inputs are validated/normalized by the service layer
 * - Ingest inserts are device-scoped (no beekeeper join here)
 */

const { query } = require("./pool");

/**
 * Map common Postgres constraint errors to stable API errors.
 */
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

  // Check constraint violation (range checks)
  if (err?.code === "23514") {
    const e = new Error("Invalid reading values");
    e.status = 400;
    e.code = "INVALID_READING";
    return e;
  }

  // Numeric out of range / invalid text representation
  if (err?.code === "22003" || err?.code === "22P02") {
    const e = new Error("Invalid reading values");
    e.status = 400;
    e.code = "INVALID_READING";
    return e;
  }

  return null;
}

/**
 * ORDER BY direction cannot be parameterized; guard against injection.
 */
function toOrderSql(order) {
  const o = String(order ?? "asc").toLowerCase().trim();
  if (o === "asc") return "ASC";
  if (o === "desc") return "DESC";
  return "ASC";
}

/**
 * Insert a reading for a device (ingest-only; relies on DB constraints).
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

    return rows[0] ?? null;
  } catch (err) {
    const mapped = mapPgError(err);
    if (mapped) throw mapped;
    throw err;
  }
};

/**
 * Time-series readings for a hive since (optional until).
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

  return query(
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
};

/**
 * Latest reading across the hive.
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

  return rows[0] ?? null;
};

/**
 * Daily aggregates since a timestamp (stub).
 */
exports.getHiveDailySince = async () => {
  const e = new Error("Daily aggregates not implemented");
  e.status = 501;
  e.code = "NOT_IMPLEMENTED";
  throw e;
};

/**
 * Latest daily aggregate row for a hive (stub).
 */
exports.getLatestDailyForHive = async () => {
  const e = new Error("Daily aggregates not implemented");
  e.status = 501;
  e.code = "NOT_IMPLEMENTED";
  throw e;
};
