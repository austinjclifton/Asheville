"use strict";

/**
 * Devices Repository (PostgreSQL)
 *
 * Ownership enforcement:
 * device → hive → beekeeper
 */

const { query } = require("./pool");

/* -------------------------------------------------------------------------- */

exports.create = async ({ beekeeperId, hiveId, installedAt }) => {
  const sql = `
    INSERT INTO device (hive_id, installed_at)
    SELECT $1, $2
    FROM hive
    WHERE id = $1
      AND beekeeper_id = $3
    RETURNING *
  `;

  const rows = await query(sql, [hiveId, installedAt, beekeeperId]);
  return rows[0] ?? null;
};

/* -------------------------------------------------------------------------- */

exports.findByBeekeeper = async (beekeeperId) => {
  const sql = `
    SELECT d.*
    FROM device d
    JOIN hive h ON d.hive_id = h.id
    WHERE h.beekeeper_id = $1
    ORDER BY d.id DESC
  `;

  return query(sql, [beekeeperId]);
};

/* -------------------------------------------------------------------------- */

exports.findById = async ({ beekeeperId, deviceId }) => {
  const sql = `
    SELECT d.*
    FROM device d
    JOIN hive h ON d.hive_id = h.id
    WHERE d.id = $1
      AND h.beekeeper_id = $2
  `;

  const rows = await query(sql, [deviceId, beekeeperId]);
  return rows[0] ?? null;
};

/* -------------------------------------------------------------------------- */

exports.update = async ({
  beekeeperId,
  deviceId,
  installedAt,
  lastSeenAt,
}) => {
  const set = [];
  const values = [];
  let i = 1;

  if (installedAt !== undefined) {
    set.push(`installed_at = $${i++}`);
    values.push(installedAt);
  }

  if (lastSeenAt !== undefined) {
    set.push(`last_seen_at = $${i++}`);
    values.push(lastSeenAt);
  }

  if (set.length === 0) {
    return exports.findById({ beekeeperId, deviceId });
  }

  values.push(deviceId);
  values.push(beekeeperId);

  const sql = `
    UPDATE device d
    SET ${set.join(", ")}
    FROM hive h
    WHERE d.id = $${i++}
      AND d.hive_id = h.id
      AND h.beekeeper_id = $${i++}
    RETURNING d.*
  `;

  const rows = await query(sql, values);
  return rows[0] ?? null;
};

/* -------------------------------------------------------------------------- */

exports.remove = async ({ beekeeperId, deviceId }) => {
  const sql = `
    DELETE FROM device d
    USING hive h
    WHERE d.id = $1
      AND d.hive_id = h.id
      AND h.beekeeper_id = $2
  `;

  const result = await query(sql, [deviceId, beekeeperId]);
  return result.rowCount > 0;
};
