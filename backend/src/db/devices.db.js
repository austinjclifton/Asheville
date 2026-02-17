"use strict";

/**
 * device repo
 *
 * Ownership enforcement:
 * device → hive → beekeeper
 *
 * Function Index:
 * - createScoped({ beekeeperId, hiveId, installedAt?, lastSeenAt? }) -> device | null
 * - listByBeekeeper({ beekeeperId }) -> device[]
 * - listByHiveScoped({ beekeeperId, hiveId }) -> device[]               (kept for compatibility; max 1)
 * - findByHiveScoped({ beekeeperId, hiveId }) -> device | null          (preferred for 1:1)
 * - findByIdScoped({ beekeeperId, deviceId }) -> device | null
 * - existsScoped({ beekeeperId, deviceId }) -> boolean
 * - updateScoped({ beekeeperId, deviceId, installedAt?, lastSeenAt? }) -> device | null
 * - touchLastSeenScoped({ beekeeperId, deviceId, seenAt? }) -> device | null
 * - removeScoped({ beekeeperId, deviceId }) -> boolean
 */

const { query } = require("./pool");

/* ========================================================================== */
/* Create                                                                     */
/* ========================================================================== */

/**
 * createScoped
 *
 * Inserts only if:
 * - hive exists
 * - hive belongs to beekeeper
 *
 * For 1:1 hive↔device, the DB should enforce UNIQUE(device.hive_id).
 *
 * Returns:
 * - device row if inserted
 * - null if hive not found / not owned
 *
 * Throws:
 * - Postgres unique violation (23505) if hive already has a device
 *   (service layer should translate to 409 Conflict)
 */
exports.createScoped = async ({
  beekeeperId,
  hiveId,
  installedAt,
  lastSeenAt,
}) => {
  // If installedAt is provided, we explicitly set it.
  // If installedAt is null/undefined, we omit it so DB DEFAULT now() applies.
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

/* ========================================================================== */
/* Read                                                                       */
/* ========================================================================== */

exports.listByBeekeeper = async ({ beekeeperId }) => {
  return query(
    `
    SELECT d.*
    FROM device d
    JOIN hive h ON h.id = d.hive_id
    WHERE h.beekeeper_id = $1
    ORDER BY d.id DESC
    `,
    [beekeeperId],
  );
};

/**
 * listByHiveScoped
 *
 * Kept to preserve integrity of existing callers that expect an array.
 * Under 1:1, this will return either [] or [device].
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
    [hiveId, beekeeperId],
  );
};

/**
 * findByHiveScoped
 *
 * Preferred helper for 1:1 hive↔device.
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
    [hiveId, beekeeperId],
  );

  return rows[0] ?? null;
};

exports.findByIdScoped = async ({ beekeeperId, deviceId }) => {
  const rows = await query(
    `
    SELECT d.*
    FROM device d
    JOIN hive h ON h.id = d.hive_id
    WHERE d.id = $1
      AND h.beekeeper_id = $2
    `,
    [deviceId, beekeeperId],
  );

  return rows[0] ?? null;
};

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
    [deviceId, beekeeperId],
  );

  return rows.length > 0;
};

/* ========================================================================== */
/* Update                                                                     */
/* ========================================================================== */

/**
 * updateScoped
 *
 * PATCH semantics:
 * - if a field is undefined: do not change it
 * - if a field is null: set it to NULL
 */
exports.updateScoped = async ({
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

  // No-op patch: return current row (scoped)
  if (set.length === 0) {
    return exports.findByIdScoped({ beekeeperId, deviceId });
  }

  // WHERE placeholders
  values.push(deviceId);
  values.push(beekeeperId);

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
    values,
  );

  return rows[0] ?? null;
};

/**
 * touchLastSeenScoped
 *
 * Convenience helper for “device ping / ingest” flows.
 * Default is now() if seenAt is undefined.
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
    [seenAt ?? null, deviceId, beekeeperId],
  );

  return rows[0] ?? null;
};

/* ========================================================================== */
/* Delete                                                                     */
/* ========================================================================== */

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
    [deviceId, beekeeperId],
  );

  return rows.length > 0;
};
