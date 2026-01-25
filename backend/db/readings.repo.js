/**
 * Readings Repository
 * Table: reading
 */

"use strict";

const { query } = require("./pool");

/* ================================================================
 * Core ingestion & retrieval
 * ================================================================ */

/**
 * create
 *
 * Used by:
 * - ingestion endpoint
 *
 * Idempotent at DB level via (device_id, recorded_at) UNIQUE key
 */
exports.create = async ({
  deviceId,
  recordedAt,
  temperatureC,
  batteryVoltage,
  signalStrength,
}) => {
  const sql = `
    INSERT INTO reading (
      device_id,
      recorded_at,
      temperature_c,
      battery_voltage,
      signal_strength
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  await query(sql, [
    deviceId,
    recordedAt,
    temperatureC,
    batteryVoltage ?? null,
    signalStrength ?? null,
  ]);
};

/**
 * findLatestByDevice
 *
 * Used for:
 * - current temperature display
 */
exports.findLatestByDevice = async (deviceId) => {
  const sql = `
    SELECT *
    FROM reading
    WHERE device_id = ?
    ORDER BY recorded_at DESC
    LIMIT 1
  `;

  const [rows] = await query(sql, [deviceId]);
  return rows[0] ?? null;
};

/* ================================================================
 * Historical queries (STUBS)
 * ================================================================ */

/**
 * findByDeviceInRange
 *
 * Intended for:
 * - charts
 * - analytics
 */
exports.findByDeviceInRange = async (
  _deviceId,
  _start,
  _end
) => {
  throw new Error("findByDeviceInRange not implemented");
};

/**
 * deleteByDevice
 *
 * Intended for:
 * - cleanup on device removal
 */
exports.deleteByDevice = async (_deviceId) => {
  throw new Error("deleteByDevice not implemented");
};

/**
 * aggregateDaily
 *
 * Intended for:
 * - rollups
 * - reporting
 */
exports.aggregateDaily = async (_deviceId, _date) => {
  throw new Error("aggregateDaily not implemented");
};
