"use strict";

/**
 * Sessions Service
 *
 * Responsibilities:
 * - Own session lifecycle mechanics (create / validate / invalidate)
 * - Enforce session state rules (active + not expired)
 * - Generate session and CSRF tokens
 *
 * Guarantees:
 * - Expired sessions are treated as invalid
 * - Expired sessions are invalidated on access
 * - Services normalize and validate all inputs
 */

const crypto = require("crypto");

const sessionsRepo = require("../db/sessions.db");
const usersRepo = require("../db/users.db");

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/* -------------------------------------------------------------------------- */
/* Time Utilities                                                              */
/* -------------------------------------------------------------------------- */

function now() {
  return new Date();
}

function computeExpiration() {
  return new Date(now().getTime() + SESSION_DURATION_MS);
}

function isExpired(expiresAt) {
  const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return exp <= now();
}

/* -------------------------------------------------------------------------- */
/* Token Utilities                                                             */
/* -------------------------------------------------------------------------- */

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

/* -------------------------------------------------------------------------- */
/* Mappers                                                                     */
/* -------------------------------------------------------------------------- */

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

function mapUserRow(row) {
  return {
    id: Number(row.id),
    username: row.username,
    email: row.email,
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * createSession
 *
 * Creates and persists a new session for a user.
 * Allows multiple concurrent sessions by design.
 */
exports.createSession = async ({ beekeeperId }) => {
  const normalizedId = Number(beekeeperId);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("beekeeperId is required");
  }

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
 * validateSession
 *
 * Validates a session token and returns its context.
 *
 * Returns:
 * - null if session is missing, inactive, or expired
 * - { session, user } if valid
 *
 * MUST NOT throw for auth failures.
 */
exports.validateSession = async ({ sessionToken }) => {
  if (typeof sessionToken !== "string" || sessionToken.trim() === "") {
    return null;
  }

  const sessionRow = await sessionsRepo.findByToken(sessionToken);
  if (!sessionRow) return null;

  if (sessionRow.active !== true) {
    return null;
  }

  if (isExpired(sessionRow.expires_at)) {
    // Invalidate expired session opportunistically
    await sessionsRepo.invalidate(sessionRow.id);
    return null;
  }

  const userRow = await usersRepo.findById(sessionRow.beekeeper_id);
  if (!userRow) {
    // Defensive: orphaned session
    await sessionsRepo.invalidate(sessionRow.id);
    return null;
  }

  // Update activity timestamp only after full validation
  await sessionsRepo.touch(sessionRow.id);

  return {
    session: mapSessionRow(sessionRow),
    user: mapUserRow(userRow),
  };
};

/**
 * invalidateSession
 *
 * Invalidates a single session by token.
 * No-op if session does not exist.
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
 * invalidateAllSessionsForUser
 *
 * Invalidates all sessions for a user.
 */
exports.invalidateAllSessionsForUser = async ({ beekeeperId }) => {
  const normalizedId = Number(beekeeperId);

  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("beekeeperId is required");
  }

  await sessionsRepo.invalidateAllForBeekeeper(normalizedId);
};
