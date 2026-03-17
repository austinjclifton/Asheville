"use strict";

/**
 * Hives Repository (PostgreSQL)
 * Table: hive
 */

const { query } = require("./pool");

/* ========================================================================== */
/* Inserts                                                                     */
/* ========================================================================== */

/**
 * Create a hive row.
 */
exports.create = async ({ beekeeperId, name, notes, locationId }) => {
  const rows = await query(
    `
    INSERT INTO hive (beekeeper_id, name, notes, location_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [beekeeperId, name, notes ?? null, locationId ?? null],
  );

  return rows[0] ?? null;
};

/* ========================================================================== */
/* Reads                                                                       */
/* ========================================================================== */

/**
 * List hives for a beekeeper (newest first).
 */
exports.listByBeekeeper = async ({ beekeeperId }) => {
  return query(
    `
    SELECT *
    FROM hive
    WHERE beekeeper_id = $1
    ORDER BY created_at DESC, id DESC
    `,
    [beekeeperId],
  );
};

/**
 * Find a hive by id, scoped to beekeeper ownership.
 */
exports.findByIdScoped = async ({ beekeeperId, hiveId }) => {
  const rows = await query(
    `
    SELECT *
    FROM hive
    WHERE id = $1
      AND beekeeper_id = $2
    LIMIT 1
    `,
    [hiveId, beekeeperId],
  );

  return rows[0] ?? null;
};

/**
 * Fast existence check for hive ownership scope.
 * (Used by devices.service.js; avoids SELECT * and prevents leaking fields.)
 */
exports.existsScoped = async ({ beekeeperId, hiveId }) => {
  const rows = await query(
    `
    SELECT 1
    FROM hive
    WHERE id = $1
      AND beekeeper_id = $2
    LIMIT 1
    `,
    [hiveId, beekeeperId],
  );

  return rows.length > 0;
};

/**
 * Resolve a hive's location_id (scoped to beekeeper).
 * Returns: { location_id } | null
 */
exports.getLocationIdForHive = async ({ beekeeperId, hiveId }) => {
  const rows = await query(
    `
    SELECT location_id
    FROM hive
    WHERE id = $1
      AND beekeeper_id = $2
    LIMIT 1
    `,
    [hiveId, beekeeperId],
  );

  return rows[0] ?? null;
};

/* ========================================================================== */
/* Updates                                                                     */
/* ========================================================================== */

/**
 * Patch hive fields (scoped).
 * - undefined fields are not changed
 * - notes may be null to clear
 * - locationId may be null to clear
 */
exports.updateScoped = async ({
  beekeeperId,
  hiveId,
  name,
  notes,
  locationId,
}) => {
  const set = [];
  const values = [];
  let i = 1;

  if (name !== undefined) {
    set.push(`name = $${i++}`);
    values.push(name);
  }

  if (notes !== undefined) {
    set.push(`notes = $${i++}`);
    values.push(notes);
  }

  if (locationId !== undefined) {
    set.push(`location_id = $${i++}`);
    values.push(locationId);
  }

  if (set.length === 0) {
    return exports.findByIdScoped({ beekeeperId, hiveId });
  }

  values.push(hiveId, beekeeperId);

  const rows = await query(
    `
    UPDATE hive
    SET ${set.join(", ")}
    WHERE id = $${i++}
      AND beekeeper_id = $${i++}
    RETURNING *
    `,
    values,
  );

  return rows[0] ?? null;
};

/* ========================================================================== */
/* Deletes                                                                     */
/* ========================================================================== */

/**
 * Delete a hive by id (scoped).
 * Returns true if a row was deleted.
 */
exports.removeScoped = async ({ beekeeperId, hiveId }) => {
  const rows = await query(
    `
    DELETE FROM hive
    WHERE id = $1
      AND beekeeper_id = $2
    RETURNING id
    `,
    [hiveId, beekeeperId],
  );

  return rows.length > 0;
};