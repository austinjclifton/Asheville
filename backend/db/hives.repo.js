/**
 * Hives Repository
 * Table: hive
 */

"use strict";

const { query } = require("./pool");

/* ================================================================
 * Core hive operations
 * ================================================================ */

/**
 * findById
 *
 * Used for:
 * - ownership checks
 * - hive detail views
 */
exports.findById = async (id) => {
  const sql = `
    SELECT *
    FROM hive
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await query(sql, [id]);
  return rows[0] ?? null;
};

/**
 * findAllByBeekeeper
 *
 * Used for:
 * - dashboard listing
 */
exports.findAllByBeekeeper = async (beekeeperId) => {
  const sql = `
    SELECT *
    FROM hive
    WHERE beekeeper_id = ?
    ORDER BY created_at DESC
  `;

  const [rows] = await query(sql, [beekeeperId]);
  return rows;
};

/**
 * create
 *
 * Used by:
 * - hive creation flow
 */
exports.create = async ({ beekeeperId, name, notes }) => {
  const sql = `
    INSERT INTO hive (beekeeper_id, name, notes)
    VALUES (?, ?, ?)
  `;

  const [result] = await query(sql, [
    beekeeperId,
    name,
    notes ?? null,
  ]);

  return exports.findById(result.insertId);
};

/* ================================================================
 * Hive updates (STUBS)
 * ================================================================ */

/**
 * updateDetails
 *
 * Intended for:
 * - renaming hives
 * - editing notes
 */
exports.updateDetails = async (_id, _name, _notes) => {
  throw new Error("updateDetails not implemented");
};

/**
 * deleteById
 *
 * Intended for:
 * - manual hive deletion
 * - cascade cleanup
 */
exports.deleteById = async (_id) => {
  throw new Error("deleteById not implemented");
};
