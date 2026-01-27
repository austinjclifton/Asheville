/**
 * Devices Repository
 * Table: device
 */

"use strict";

const { query } = require("./pool");

/* ================================================================
 * Core device operations
 * ================================================================ */

/**
 * findById
 *
 * Used for:
 * - ingestion validation
 * - ownership checks (via hive)
 */
exports.findById = async (id) => {
  const sql = `
    SELECT *
    FROM device
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await query(sql, [id]);
  return rows[0] ?? null;
};

/**
 * findActiveByHive
 *
 * Used for:
 * - dashboard display
 * - selecting current devices
 */
exports.findActiveByHive = async (hiveId) => {
  const sql = `
    SELECT *
    FROM device
    WHERE hive_id = ?
      AND active = 1
    ORDER BY installed_at DESC
  `;

  const [rows] = await query(sql, [hiveId]);
  return rows;
};

/**
 * create
 *
 * Used by:
 * - device provisioning
 */
exports.create = async ({ hiveId, installedAt }) => {
  const sql = `
    INSERT INTO device (hive_id, installed_at)
    VALUES (?, ?)
  `;

  const [result] = await query(sql, [
    hiveId,
    installedAt ?? null,
  ]);

  return exports.findById(result.insertId);
};

/* ================================================================
 * Device lifecycle (STUBS)
 * ================================================================ */

/**
 * markInactive
 *
 * Intended for:
 * - device replacement
 */
exports.markInactive = async (_id) => {
  throw new Error("markInactive not implemented");
};

/**
 * updateLastSeen
 *
 * Intended for:
 * - heartbeat / ingestion tracking
 */
exports.updateLastSeen = async (_id, _timestamp) => {
  throw new Error("updateLastSeen not implemented");
};

/**
 * findByHive
 *
 * Intended for:
 * - historical device listings
 */
exports.findByHive = async (_hiveId) => {
  throw new Error("findByHive not implemented");
};
