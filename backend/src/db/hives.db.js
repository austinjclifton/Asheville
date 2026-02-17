"use strict";

/**
 * Hives Repository (PostgreSQL)
 * Table: hive
 *
 * Responsibilities:
 * - SQL only (no business rules)
 * - Parameterized queries only
 * - Enforce ownership via beekeeper_id scoping
 */

const { query } = require("./pool");

/**
 * Create a hive row.
 */
exports.create = async ({ beekeeperId, name, notes }) => {
  const rows = await query(
    `
    INSERT INTO hive (beekeeper_id, name, notes)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [beekeeperId, name, notes ?? null]
  );

  return rows[0] ?? null;
};

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
    [beekeeperId]
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
    [hiveId, beekeeperId]
  );

  return rows[0] ?? null;
};

/**
 * Check whether a hive exists and is owned by the beekeeper.
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
    [hiveId, beekeeperId]
  );

  return rows.length > 0;
};

/**
 * Count hives for a beekeeper.
 */
exports.countByBeekeeper = async ({ beekeeperId }) => {
  const rows = await query(
    `
    SELECT COUNT(*)::int AS count
    FROM hive
    WHERE beekeeper_id = $1
    `,
    [beekeeperId]
  );

  return rows[0]?.count ?? 0;
};

/**
 * Patch hive fields (scoped).
 * - undefined fields are not changed
 * - notes may be null to clear
 */
exports.updateScoped = async ({ beekeeperId, hiveId, name, notes }) => {
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

  // No-op PATCH: return current row (still scoped).
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
    values
  );

  return rows[0] ?? null;
};

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
    [hiveId, beekeeperId]
  );

  return rows.length > 0;
};
