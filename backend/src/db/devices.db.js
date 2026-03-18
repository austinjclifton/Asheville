"use strict";

/**
 * Devices Repository (PostgreSQL)
 * Table: device
 *
 * Notes:
 * - Under 1:1 hive<->device, DB enforces UNIQUE(device.hive_id)
 */

const { query } = require("./pool");

/* ========================================================================== */
/* Inserts                                                                     */
/* ========================================================================== */

/**
 * Insert a device for a hive, only when the hive is owned by the beekeeper.
 * Returns the inserted row, or null when hive is not found / not owned.
 */
exports.createScoped = async ({ beekeeperId, hiveId, installedAt, lastSeenAt }) => {
  const hasInstalled = installedAt !== undefined;
  const hasSeen = lastSeenAt !== undefined;

  // Build dynamic insert column/value lists
  const cols = ["hive_id"];
  const vals = ["h.id"];
  const params = [];
  let p = 1;

  if (hasInstalled) {
    cols.push("installed_at");
    vals.push(`$${p++}`);
    params.push(installedAt);
  }

  if (hasSeen) {
    cols.push("last_seen_at");
    vals.push(`$${p++}`);
    params.push(lastSeenAt);
  }

  // scoping params
  const hiveIdParam = p++;
  const beekeeperIdParam = p++;
  params.push(hiveId, beekeeperId);

  try {
    const rows = await query(
      `
      INSERT INTO device (${cols.join(", ")})
      SELECT ${vals.join(", ")}
      FROM hive h
      WHERE h.id = $${hiveIdParam}
        AND h.beekeeper_id = $${beekeeperIdParam}
      RETURNING *
      `,
      params
    );

    return rows[0] ?? null;
  } catch (err) {
    throw mapPgError(err) ?? err;
  }
};

/* ========================================================================== */
/* Reads                                                                       */
/* ========================================================================== */

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
    [beekeeperId],
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
    [hiveId, beekeeperId],
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
    [hiveId, beekeeperId],
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
    [deviceId, beekeeperId],
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
    [deviceId, beekeeperId],
  );

  return rows.length > 0;
};

/* ========================================================================== */
/* Updates                                                                     */
/* ========================================================================== */

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
    values,
  );

  return rows[0] ?? null;
};

/**
 * Touch last_seen_at for a device (unscoped).
 * If seenAt is undefined/null, defaults to now().
 */
exports.touchLastSeen = async ({ deviceId, seenAt }) => {
  const rows = await query(
    `
    UPDATE device
    SET last_seen_at = COALESCE($1, now())
    WHERE id = $2
    RETURNING *
    `,
    [seenAt ?? null, deviceId],
  );

  return rows[0] ?? null;
};

/* ========================================================================== */
/* Deletes                                                                     */
/* ========================================================================== */

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
    [deviceId, beekeeperId],
  );

  return rows.length > 0;
};

/* ========================================================================== */
/* External Conditions support                                                 */
/* ========================================================================== */

/**
 * Resolve a device's location_id via device -> hive.
 * Returns: { location_id } | null
 */
exports.getLocationIdForDevice = async ({ deviceId }) => {
  const rows = await query(
    `
    SELECT h.location_id
    FROM device d
    JOIN hive h ON h.id = d.hive_id
    WHERE d.id = $1
    LIMIT 1
    `,
    [deviceId],
  );

  return rows[0] ?? null;
};

/* ========================================================================== */
/* Error mapping                                                               */
/* ========================================================================== */

function mapPgError(err) {
  if (!err?.code) return null;

  if (err.code === "23505") {
    const constraint = err.constraint || err.detail || "";
    const e = new Error("Device already exists for this hive");
    e.status = 409;
    e.code = "DUPLICATE_DEVICE";
    e.meta = { constraint };
    return e;
  }

  if (err.code === "23503") {
    const e = new Error("Hive does not exist");
    e.status = 400;
    e.code = "HIVE_NOT_FOUND";
    return e;
  }

  if (err.code === "22003" || err.code === "22P02") {
    const e = new Error("Invalid device values");
    e.status = 400;
    e.code = "INVALID_DEVICE";
    return e;
  }

  return null;
}