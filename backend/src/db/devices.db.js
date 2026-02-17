"use strict";

/**
 * Devices Repository (PostgreSQL)
 * Table: device
 *
 * Responsibilities:
 * - SQL only (no business rules)
 * - Parameterized queries only
 * - Enforce ownership via joins: device -> hive -> beekeeper
 *
 * Notes:
 * - Under 1:1 hive<->device, DB should enforce UNIQUE(device.hive_id)
 */

const { query } = require("./pool");

/**
 * Insert a device for a hive, only when the hive is owned by the beekeeper.
 * Returns the inserted row, or null when hive is not found / not owned.
 */
exports.createScoped = async ({ beekeeperId, hiveId, installedAt, lastSeenAt }) => {
  // If installedAt is provided (non-null), set it; otherwise let DB default apply.
  const hasInstalledAt = installedAt !== undefined && installedAt !== null;

  const sql = hasInstalledAt
    ? `
      INSERT INTO device (hive_id, installed_at, last_seen_at)
      SELECT h.id, $1, $2
      FROM hive h
      WHERE h.id = $3
        AND h.beekeeper_id = $4
      RETURNING *
    `
    : `
      INSERT INTO device (hive_id, last_seen_at)
      SELECT h.id, $1
      FROM hive h
      WHERE h.id = $2
        AND h.beekeeper_id = $3
      RETURNING *
    `;

  const params = hasInstalledAt
    ? [installedAt, lastSeenAt ?? null, hiveId, beekeeperId]
    : [lastSeenAt ?? null, hiveId, beekeeperId];

  const rows = await query(sql, params);
  return rows[0] ?? null;
};

/**
 * List all devices for a beekeeper.
 */
exports.listByBeekeeper = async ({ beekeeperId }) => {
  return query(
    `
    SELECT d.*
    FROM device d
    JOIN hive h ON h.id = d.hive_id
    WHERE h.beekeeper_id = $1
    ORDER BY d.id DESC
    `,
    [beekeeperId]
  );
};

/**
 * List devices for a hive (scoped).
 * Kept for compatibility with callers expecting an array (0..1 under 1:1).
 */
exports.listByHiveScoped = async ({ beekeeperId, hiveId }) => {
  return query(
    `
    SELECT d.*
    FROM device d
    JOIN hive h ON h.id = d.hive_id
    WHERE d.hive_id = $1
      AND h.beekeeper_id = $2
    ORDER BY d.id DESC
    `,
    [hiveId, beekeeperId]
  );
};

/**
 * Find a device for a hive (scoped). Preferred for 1:1.
 */
exports.findByHiveScoped = async ({ beekeeperId, hiveId }) => {
  const rows = await query(
    `
    SELECT d.*
    FROM device d
    JOIN hive h ON h.id = d.hive_id
    WHERE d.hive_id = $1
      AND h.beekeeper_id = $2
    LIMIT 1
    `,
    [hiveId, beekeeperId]
  );

  return rows[0] ?? null;
};

/**
 * Find a device by id (scoped).
 */
exports.findByIdScoped = async ({ beekeeperId, deviceId }) => {
  const rows = await query(
    `
    SELECT d.*
    FROM device d
    JOIN hive h ON h.id = d.hive_id
    WHERE d.id = $1
      AND h.beekeeper_id = $2
    LIMIT 1
    `,
    [deviceId, beekeeperId]
  );

  return rows[0] ?? null;
};

/**
 * Check device existence by id (scoped).
 */
exports.existsScoped = async ({ beekeeperId, deviceId }) => {
  const rows = await query(
    `
    SELECT 1
    FROM device d
    JOIN hive h ON h.id = d.hive_id
    WHERE d.id = $1
      AND h.beekeeper_id = $2
    LIMIT 1
    `,
    [deviceId, beekeeperId]
  );

  return rows.length > 0;
};

/**
 * Patch device fields (scoped).
 * - undefined fields are not changed
 * - null values set the column to NULL
 */
exports.updateScoped = async ({ beekeeperId, deviceId, installedAt, lastSeenAt }) => {
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

  // No-op patch: return current row (scoped).
  if (set.length === 0) {
    return exports.findByIdScoped({ beekeeperId, deviceId });
  }

  values.push(deviceId, beekeeperId);

  const rows = await query(
    `
    UPDATE device d
    SET ${set.join(", ")}
    FROM hive h
    WHERE d.id = $${i++}
      AND d.hive_id = h.id
      AND h.beekeeper_id = $${i++}
    RETURNING d.*
    `,
    values
  );

  return rows[0] ?? null;
};

/**
 * Touch last_seen_at for a device (scoped).
 * If seenAt is undefined/null, defaults to now().
 */
exports.touchLastSeenScoped = async ({ beekeeperId, deviceId, seenAt }) => {
  const rows = await query(
    `
    UPDATE device d
    SET last_seen_at = COALESCE($1, now())
    FROM hive h
    WHERE d.id = $2
      AND d.hive_id = h.id
      AND h.beekeeper_id = $3
    RETURNING d.*
    `,
    [seenAt ?? null, deviceId, beekeeperId]
  );

  return rows[0] ?? null;
};

/**
 * Delete a device by id (scoped).
 * Returns true if a row was deleted.
 */
exports.removeScoped = async ({ beekeeperId, deviceId }) => {
  const rows = await query(
    `
    DELETE FROM device d
    USING hive h
    WHERE d.id = $1
      AND d.hive_id = h.id
      AND h.beekeeper_id = $2
    RETURNING d.id
    `,
    [deviceId, beekeeperId]
  );

  return rows.length > 0;
};
