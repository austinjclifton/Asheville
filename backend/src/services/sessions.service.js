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
 * - Missing/blank/unknown/inactive/expired/orphaned tokens return null (not errors)
 * - Expired/orphaned sessions are invalidated opportunistically
 *
 * Notes:
 * - DB failures may throw (these are not "auth failures")
 */

const crypto = require("crypto");

const sessionsRepo = require("../db/sessions.db");
const usersRepo = require("../db/users.db");

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/* ========================================================================== */
/* Helpers                                                                     */
/* ========================================================================== */

function now() {
  return new Date();
}

function computeExpiration() {
  return new Date(now().getTime() + SESSION_DURATION_MS);
}

function isExpired(expiresAt) {
  const exp = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return Number.isNaN(exp.getTime()) || exp <= now();
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function assertPositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
  return n;
}

function isBlankString(v) {
  return typeof v !== "string" || v.trim() === "";
}

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

/* ========================================================================== */
/* API                                                                         */
/* ========================================================================== */

/**
 * Create and persist a new session for a user.
 * Allows multiple concurrent sessions by design.
 *
 * context is optional metadata (ip, userAgent, etc.) to persist if repo supports it.
 */
exports.createSession = async ({ beekeeperId, context }) => {
  const id = assertPositiveInt(beekeeperId, "beekeeperId");

  const sessionToken = generateToken(32);
  const csrfToken = generateToken(32);
  const expiresAt = computeExpiration();

  const row = await sessionsRepo.create({
    beekeeperId: id,
    sessionToken,
    csrfToken,
    expiresAt,
    context, // pass through (repo can ignore if not used)
  });

  return mapSessionRow(row);
};

/**
 * Validate a session token and return its context.
 *
 * Returns:
 * - null if missing, inactive, expired, or orphaned
 * - { session, user } if valid
 */
exports.validateSession = async ({ sessionToken }) => {
  if (isBlankString(sessionToken)) return null;

  const sessionRow = await sessionsRepo.findByToken(sessionToken);
  if (!sessionRow) return null;

  if (sessionRow.active !== true) return null;

  if (isExpired(sessionRow.expires_at)) {
    // best-effort cleanup; if this throws, it's a DB problem (bubble up)
    await sessionsRepo.invalidate(sessionRow.id);
    return null;
  }

  const userRow = await usersRepo.findById(sessionRow.beekeeper_id);
  if (!userRow) {
    await sessionsRepo.invalidate(sessionRow.id);
    return null;
  }

  // Touch only after full validation
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
  if (isBlankString(sessionToken)) return;

  const sessionRow = await sessionsRepo.findByToken(sessionToken);
  if (!sessionRow) return;

  await sessionsRepo.invalidate(sessionRow.id);
};

/**
 * Invalidate all sessions for a user.
 */
exports.invalidateAllSessionsForUser = async ({ beekeeperId }) => {
  const id = assertPositiveInt(beekeeperId, "beekeeperId");
  await sessionsRepo.invalidateAllForBeekeeper(id);
};
