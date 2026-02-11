"use strict";

/**
 * Hives Repository (PostgreSQL)
 *
 * Responsibilities:
 * - SQL only
 * - Parameterized queries only
 * - Enforce ownership via beekeeper_id scoping
 */

const { query } = require("./pool");

/* -------------------------------------------------------------------------- */

exports.create = async ({ beekeeperId, name, notes }) => {
  const sql = `
    INSERT INTO hive (beekeeper_id, name, notes)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const rows = await query(sql, [beekeeperId, name, notes]);
  return rows[0];
};

/* -------------------------------------------------------------------------- */

exports.findByBeekeeper = async (beekeeperId) => {
  const sql = `
    SELECT *
    FROM hive
    WHERE beekeeper_id = $1
    ORDER BY created_at DESC
  `;
  return query(sql, [beekeeperId]);
};

/* -------------------------------------------------------------------------- */

exports.findById = async ({ beekeeperId, hiveId }) => {
  const sql = `
    SELECT *
    FROM hive
    WHERE id = $1
      AND beekeeper_id = $2
  `;
  const rows = await query(sql, [hiveId, beekeeperId]);
  return rows[0] ?? null;
};

/* -------------------------------------------------------------------------- */
/**
 * update
 *
 * PATCH semantics:
 * - if a field is undefined: do not change it
 * - if notes is null: explicitly clear it
 */
exports.update = async ({ beekeeperId, hiveId, name, notes }) => {
  const set = [];
  const values = [];
  let i = 1;

  if (name !== undefined) {
    set.push(`name = $${i++}`);
    values.push(name);
  }

  if (notes !== undefined) {
    set.push(`notes = $${i++}`);
    values.push(notes); // may be null (clear)
  }

  // Defensive: service/controller should prevent no-op updates,
  // but repo should still be safe.
  if (set.length === 0) {
    const rows = await query(
      `SELECT * FROM hive WHERE id = $1 AND beekeeper_id = $2`,
      [hiveId, beekeeperId]
    );
    return rows[0] ?? null;
  }

  // WHERE clause uses beekeeper scoping as ownership enforcement.
  values.push(hiveId);
  values.push(beekeeperId);

  const sql = `
    UPDATE hive
    SET ${set.join(", ")}
    WHERE id = $${i++}
      AND beekeeper_id = $${i++}
    RETURNING *
  `;

  const rows = await query(sql, values);
  return rows[0] ?? null;
};

/* -------------------------------------------------------------------------- */

exports.remove = async ({ beekeeperId, hiveId }) => {
  const sql = `
    DELETE FROM hive
    WHERE id = $1
      AND beekeeper_id = $2
  `;
  const result = await query(sql, [hiveId, beekeeperId]);
  return result.rowCount > 0;
};
