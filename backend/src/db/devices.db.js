"use strict";

/**
 * Devices Repository (PostgreSQL)
 *
 * Ownership enforcement:
 * device → hive → beekeeper
 *
 * Responsibilities:
 * - SQL only (no business rules)
 * - Parameterized queries only
 * - Enforce ownership by joining through hive
 *
 * Function Index:
 * - createScoped({ beekeeperId, hiveId, installedAt }) -> device | null
 * - listByBeekeeper({ beekeeperId }) -> device[]
 * - listByHiveScoped({ beekeeperId, hiveId }) -> device[]
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
 * Returns:
 * - device row if inserted
 * - null if hive not found / not owned
 */
exports.createScoped = async ({ beekeeperId, hiveId, installedAt }) => {
  const rows = await query(
    `
    INSERT INTO device (hive_id, installed_at)
    SELECT h.id, $1
    FROM hive h
    WHERE h.id = $2
      AND h.beekeeper_id = $3
    RETURNING *
    `,
    [installedAt ?? null, hiveId, beekeeperId]
  );

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
    [beekeeperId]
  );
};

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

exports.findByIdScoped = async ({ beekeeperId, deviceId }) => {
  const rows = await query(
    `
    SELECT d.*
    FROM device d
    JOIN hive h ON h.id = d.hive_id
    WHERE d.id = $1
      AND h.beekeeper_id = $2
    `,
    [deviceId, beekeeperId]
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
    [deviceId, beekeeperId]
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

  if (set.length === 0) {
    return exports.findByIdScoped({ beekeeperId, deviceId });
  }

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
    values
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
    [seenAt ?? null, deviceId, beekeeperId]
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
    [deviceId, beekeeperId]
  );

  return rows.length > 0;
};
