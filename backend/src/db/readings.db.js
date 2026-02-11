"use strict";

/**
 * Readings Repository
 *
 * Responsibilities:
 * - Pure SQL
 * - No business rules
 * - Enforce ownership via joins
 * - Parameterized queries only
 */

const { query } = require("./pool");

/* -------------------------------------------------------------------------- */
/* Core Retrieval                                                              */
/* -------------------------------------------------------------------------- */

/**
 * findReadings
 *
 * Flexible historical query scoped by beekeeper.
 */
exports.findReadings = async ({
  beekeeperId,
  deviceId,
  hiveId,
  from,
  to,
  limit,
}) => {
  const values = [beekeeperId];
  let idx = values.length;

  let sql = `
    SELECT r.*
    FROM reading r
    JOIN device d ON r.device_id = d.id
    JOIN hive h ON d.hive_id = h.id
    WHERE h.beekeeper_id = $1
  `;

  if (deviceId) {
    values.push(deviceId);
    idx++;
    sql += ` AND r.device_id = $${idx}`;
  }

  if (hiveId) {
    values.push(hiveId);
    idx++;
    sql += ` AND d.hive_id = $${idx}`;
  }

  if (from) {
    values.push(from);
    idx++;
    sql += ` AND r.recorded_at >= $${idx}`;
  }

  if (to) {
    values.push(to);
    idx++;
    sql += ` AND r.recorded_at <= $${idx}`;
  }

  values.push(limit);
  idx++;
  sql += `
    ORDER BY r.recorded_at DESC
    LIMIT $${idx}
  `;

  const rows = await query(sql, values);
  return rows;
};

/* -------------------------------------------------------------------------- */
/* Latest Readings                                                             */
/* -------------------------------------------------------------------------- */

/**
 * findLatestReadings
 *
 * If deviceId provided → latest for that device.
 * Otherwise → latest per device owned by beekeeper.
 */
exports.findLatestReadings = async ({
  beekeeperId,
  deviceId,
  hiveId,
}) => {
  const values = [beekeeperId];
  let idx = values.length;

  let baseJoin = `
    FROM reading r
    JOIN device d ON r.device_id = d.id
    JOIN hive h ON d.hive_id = h.id
    WHERE h.beekeeper_id = $1
  `;

  if (deviceId) {
    values.push(deviceId);
    idx++;
    const sql = `
      SELECT r.*
      ${baseJoin}
      AND r.device_id = $${idx}
      ORDER BY r.recorded_at DESC
      LIMIT 1
    `;
    const rows = await query(sql, values);
    return rows;
  }

  if (hiveId) {
    values.push(hiveId);
    idx++;
    baseJoin += ` AND d.hive_id = $${idx}`;
  }

  const sql = `
    SELECT DISTINCT ON (r.device_id) r.*
    ${baseJoin}
    ORDER BY r.device_id, r.recorded_at DESC
  `;

  const rows = await query(sql, values);
  return rows;
};

/* -------------------------------------------------------------------------- */
/* Aggregates                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * findReadingStats
 *
 * Returns min/max/avg/count.
 */
exports.findReadingStats = async ({
  beekeeperId,
  deviceId,
  hiveId,
  from,
  to,
}) => {
  const values = [beekeeperId];
  let idx = values.length;

  let sql = `
    SELECT
      MIN(r.temperature_f) AS min,
      MAX(r.temperature_f) AS max,
      AVG(r.temperature_f) AS avg,
      COUNT(*) AS count
    FROM reading r
    JOIN device d ON r.device_id = d.id
    JOIN hive h ON d.hive_id = h.id
    WHERE h.beekeeper_id = $1
  `;

  if (deviceId) {
    values.push(deviceId);
    idx++;
    sql += ` AND r.device_id = $${idx}`;
  }

  if (hiveId) {
    values.push(hiveId);
    idx++;
    sql += ` AND d.hive_id = $${idx}`;
  }

  if (from) {
    values.push(from);
    idx++;
    sql += ` AND r.recorded_at >= $${idx}`;
  }

  if (to) {
    values.push(to);
    idx++;
    sql += ` AND r.recorded_at <= $${idx}`;
  }

  const rows = await query(sql, values);
  return rows[0];
};
