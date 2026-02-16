"use strict";

/**
 * Hives Repository (PostgreSQL)
 *
 * Responsibilities:
 * - SQL only (no business rules)
 * - Parameterized queries only
 * - Enforce ownership via beekeeper_id scoping
 *
 * Function Index:
 * - create({ beekeeperId, name, notes }) -> hive
 * - listByBeekeeper({ beekeeperId }) -> hive[]
 * - findByIdScoped({ beekeeperId, hiveId }) -> hive | null
 * - existsScoped({ beekeeperId, hiveId }) -> boolean
 * - updateScoped({ beekeeperId, hiveId, name?, notes? }) -> hive | null
 * - removeScoped({ beekeeperId, hiveId }) -> boolean
 * - countByBeekeeper({ beekeeperId }) -> number
 */

const { query } = require("./pool");

/* ========================================================================== */
/* Create                                                                     */
/* ========================================================================== */

exports.create = async ({ beekeeperId, name, notes }) => {
  const rows = await query(
    `
    INSERT INTO hive (beekeeper_id, name, notes)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [beekeeperId, name, notes ?? null]
  );

  return rows[0];
};

/* ========================================================================== */
/* Read                                                                       */
/* ========================================================================== */

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

exports.findByIdScoped = async ({ beekeeperId, hiveId }) => {
  const rows = await query(
    `
    SELECT *
    FROM hive
    WHERE id = $1
      AND beekeeper_id = $2
    `,
    [hiveId, beekeeperId]
  );

  return rows[0] ?? null;
};

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

/* ========================================================================== */
/* Update                                                                     */
/* ========================================================================== */

/**
 * updateScoped
 *
 * PATCH semantics:
 * - if a field is undefined: do not change it
 * - notes may be null: explicitly clears it
 *
 * Notes:
 * - updated_at is managed by trg_hive_updated_at
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
    values.push(notes); // may be null to clear
  }

  // No-op update: return current row (still scoped).
  if (set.length === 0) {
    return exports.findByIdScoped({ beekeeperId, hiveId });
  }

  values.push(hiveId);
  values.push(beekeeperId);

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

/* ========================================================================== */
/* Delete                                                                     */
/* ========================================================================== */

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
