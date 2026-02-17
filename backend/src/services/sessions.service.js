"use strict";

/**
 * Sessions Service
 *
 * Responsibilities:
 * - Own session lifecycle (create / validate / invalidate)
 * - Enforce session state rules (active + not expired)
 * - Generate session + CSRF tokens
 *
 * Guarantees:
 * - Expired sessions are treated as invalid
 * - Expired sessions are invalidated on access
 * - Auth failures return null (do not throw)
 */

const crypto = require("crypto");

const sessionsRepo = require("../db/sessions.db");
const usersRepo = require("../db/users.db");

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Return current time (isolated for testability).
 */
function now() {
  return new Date();
}

/**
 * Compute session expiration timestamp.
 */
function computeExpiration() {
  return new Date(now().getTime() + SESSION_DURATION_MS);
}

/**
 * Check whether an expiration timestamp is in the past.
 */
function isExpired(expiresAt) {
  const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return exp <= now();
}

/**
 * Generate a cryptographically secure random token.
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Normalize and validate a positive integer id.
 */
function normalizePositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    const err = new Error(`${field} is required`);
    err.status = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  return n;
}

/**
 * Map a session DB row to API/service shape.
 */
function mapSessionRow(row) {
  return {
    id: row.id,
    beekeeperId: Number(row.beekeeper_id),
    sessionToken: row.session_token,
    csrfToken: row.csrf_token,
    expiresAt: row.expires_at,
    active: row.active,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
  };
}

/**
 * Map a user DB row to minimal session context shape.
 */
function mapUserRow(row) {
  return {
    id: Number(row.id),
    username: row.username,
    email: row.email,
  };
}

/**
 * Create and persist a new session for a user.
 * Allows multiple concurrent sessions by design.
 */
exports.createSession = async ({ beekeeperId }) => {
  const normalizedId = normalizePositiveInt(beekeeperId, "beekeeperId");

  const sessionToken = generateToken(32);
  const csrfToken = generateToken(32);
  const expiresAt = computeExpiration();

  const row = await sessionsRepo.create({
    beekeeperId: normalizedId,
    sessionToken,
    csrfToken,
    expiresAt,
  });

  return mapSessionRow(row);
};

/**
 * Validate a session token and return its context.
 *
 * Returns:
 * - null if missing, inactive, expired, or orphaned
 * - { session, user } if valid
 *
 * Must not throw for auth failures.
 */
exports.validateSession = async ({ sessionToken }) => {
  // Treat missing/blank tokens as unauthenticated.
  if (typeof sessionToken !== "string" || sessionToken.trim() === "") {
    return null;
  }

  const sessionRow = await sessionsRepo.findByToken(sessionToken);
  if (!sessionRow) return null;

  // Inactive sessions are invalid.
  if (sessionRow.active !== true) {
    return null;
  }

  // Expired sessions are invalidated opportunistically.
  if (isExpired(sessionRow.expires_at)) {
    await sessionsRepo.invalidate(sessionRow.id);
    return null;
  }

  // Session must resolve to a real user; otherwise invalidate defensively.
  const userRow = await usersRepo.findById(sessionRow.beekeeper_id);
  if (!userRow) {
    await sessionsRepo.invalidate(sessionRow.id);
    return null;
  }

  // Touch activity only after the session is fully validated.
  await sessionsRepo.touch(sessionRow.id);

  return {
    session: mapSessionRow(sessionRow),
    user: mapUserRow(userRow),
  };
};

/**
 * Invalidate a single session by token (no-op if not found).
 */
exports.invalidateSession = async ({ sessionToken }) => {
  if (typeof sessionToken !== "string" || sessionToken.trim() === "") {
    return;
  }

  const sessionRow = await sessionsRepo.findByToken(sessionToken);
  if (!sessionRow) return;

  await sessionsRepo.invalidate(sessionRow.id);
};

/**
 * Invalidate all sessions for a user.
 */
exports.invalidateAllSessionsForUser = async ({ beekeeperId }) => {
  const normalizedId = normalizePositiveInt(beekeeperId, "beekeeperId");
  await sessionsRepo.invalidateAllForBeekeeper(normalizedId);
};
