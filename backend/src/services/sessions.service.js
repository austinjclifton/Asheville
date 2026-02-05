"use strict";

/**
 * Sessions Service (MVP)
 *
 * Responsibilities:
 * - Own session lifecycle rules
 * - Validate session state
 * - Generate and invalidate session tokens
 *
 * This service:
 * - Is HTTP-agnostic
 * - Does NOT know about Express or cookies
 * - Does NOT perform SQL directly
 *
 * Database access is delegated to repositories.
 */

const sessionsRepo = require("../db/sessions.db");
const usersRepo = require("../db/users.db");
const crypto = require("crypto");

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/* -------------------------------------------------------------------------- */
/* Utilities                                                                   */
/* -------------------------------------------------------------------------- */

function computeExpiration() {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function mapSessionRow(row) {
  return {
    id: row.id,
    beekeeperId: row.beekeeper_id,
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
    id: row.id,
    username: row.username,
    email: row.email,
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

exports.createSession = async ({ beekeeperId, context }) => {
  if (!beekeeperId) {
    throw new Error("beekeeperId is required");
  }

  const sessionToken = generateToken(32);
  const csrfToken = generateToken(32);
  const expiresAt = computeExpiration();

  const row = await sessionsRepo.create({
    beekeeperId,
    sessionToken,
    csrfToken,
    expiresAt,
    context,
  });

  return mapSessionRow(row);
};

exports.validateSession = async ({ sessionToken }) => {
  if (!sessionToken) {
    throw new Error("sessionToken is required");
  }

  const sessionRow = await sessionsRepo.findByToken(sessionToken);
  if (!sessionRow) return null;

  // Only allow active, unexpired sessions
  if (sessionRow.active !== true) return null;
  const now = new Date();
  if (sessionRow.expires_at <= now) return null;

  const userRow = await usersRepo.findById(sessionRow.beekeeper_id);
  if (!userRow) return null;

  // Only touch after all checks pass
  await sessionsRepo.touch(sessionRow.id);

  return {
    session: mapSessionRow(sessionRow),
    user: mapUserRow(userRow),
  };
};

exports.invalidateSession = async ({ sessionToken }) => {
  if (!sessionToken) {
    throw new Error("sessionToken is required");
  }

  const sessionRow = await sessionsRepo.findByToken(sessionToken);
  if (!sessionRow) {
    return;
  }

  await sessionsRepo.invalidate(sessionRow.id);
};

exports.invalidateAllSessionsForUser = async ({ beekeeperId }) => {
  if (!beekeeperId) {
    throw new Error("beekeeperId is required");
  }

  await sessionsRepo.invalidateAllForBeekeeper(beekeeperId);
};
