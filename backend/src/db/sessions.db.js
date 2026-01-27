/**
 * Sessions Repository
 * Table: session
 */

"use strict";

const { query } = require("./pool");

/* ================================================================
 * Core session operations
 * ================================================================ */

/**
 * create
 *
 * Used by:
 * - login flow
 * - session refresh
 *
 * @param {Object} params
 * @param {number} params.beekeeperId
 * @param {string} params.sessionToken
 * @param {Date} params.expiresAt
 *
 * @returns {Object}
 */
exports.create = async ({
  beekeeperId,
  sessionToken,
  expiresAt,
}) => {
  const sql = `
    INSERT INTO session (beekeeper_id, session_token, expires_at)
    VALUES (?, ?, ?)
  `;

  const [result] = await query(sql, [
    beekeeperId,
    sessionToken,
    expiresAt,
  ]);

  return exports.findById(result.insertId);
};

/**
 * findByToken
 *
 * Used by:
 * - auth middleware
 * - session validation
 *
 * @param {string} sessionToken
 * @returns {Object|null}
 */
exports.findByToken = async (sessionToken) => {
  const sql = `SELECT * FROM session WHERE session_token = ?   AND active = 1 LIMIT 1`;

  const [rows] = await query(sql, [sessionToken]);
  return rows[0] ?? null;
};

/* ================================================================
 * Direct lookups (STUBS)
 * ================================================================ */

/**
 * findById
 *
 * Intended for:
 * - internal validation
 * - admin tooling
 */
exports.findById = async (_id) => {
  throw new Error("findById not implemented");
};

/**
 * findActiveByBeekeeper
 *
 * Intended for:
 * - multi-session support
 * - session management UIs
 */
exports.findActiveByBeekeeper = async (_beekeeperId) => {
  throw new Error("findActiveByBeekeeper not implemented");
};

/* ================================================================
 * Session lifecycle (STUBS)
 * ================================================================ */

/**
 * invalidate
 *
 * Intended for:
 * - logout
 * - forced session revocation
 *
 * @param {number} sessionId
 * @returns {void}
 */
exports.invalidate = async (_sessionId) => {
  throw new Error("invalidate not implemented");
};

/**
 * invalidateAllForBeekeeper
 *
 * Intended for:
 * - password change
 * - account security events
 */
exports.invalidateAllForBeekeeper = async (_beekeeperId) => {
  throw new Error("invalidateAllForBeekeeper not implemented");
};

/* ================================================================
 * Activity tracking (STUBS)
 * ================================================================ */

/**
 * touch
 *
 * Updates last activity timestamp.
 *
 * Intended for:
 * - idle timeout enforcement
 * - analytics
 *
 * @param {number} sessionId
 */
exports.touch = async (_sessionId) => {
  throw new Error("touch not implemented");
};

/**
 * expireInactive
 *
 * Intended for:
 * - background cleanup jobs
 */
exports.expireInactive = async () => {
  throw new Error("expireInactive not implemented");
};
