"use strict";

/**
 * Auth Service (MVP)
 *
 * Responsibilities:
 * - Own authentication flows (register, login, logout)
 * - Own session lifecycle at a business-rule level
 * - Stay HTTP-agnostic
 *
 * This file intentionally:
 * - Contains ONLY exported service functions
 * - Uses minimal helpers inline
 * - Avoids premature abstractions
 *
 * DB/repository logic will be injected later.
 */

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

/* -------------------------------------------------------------------------- */
/* Utilities (MVP-only, minimal)                                               */
/* -------------------------------------------------------------------------- */

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function normalizeIdentifier(identifier) {
  return typeof identifier === "string" ? identifier.trim() : "";
}

function computeSessionExpiration() {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

function generateSessionToken() {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * register
 *
 * Creates a user and initial session.
 */
exports.register = async ({ username, email, password, context }) => {
  if (!username || !email || !password) {
    throw new Error("Missing required registration fields");
  }

  const normalizedEmail = normalizeEmail(email);

  // TODO (DB layer):
  // - ensure username/email uniqueness
  // - hash password
  // - create user
  // - persist session

  const user = null; // placeholder
  const session = {
    id: null,
    token: generateSessionToken(),
    expiresAt: computeSessionExpiration(),
  };

  return { user, session };
};

/**
 * login
 *
 * Authenticates a user and creates a session.
 */
exports.login = async ({ identifier, password, context }) => {
  if (!identifier || !password) {
    throw new Error("Missing credentials");
  }

  const normalizedIdentifier = normalizeIdentifier(identifier);

  // TODO (DB layer):
  // - resolve identifier (email vs username)
  // - load user
  // - verify password hash
  // - persist session

  const user = null; // placeholder
  const session = {
    id: null,
    token: generateSessionToken(),
    expiresAt: computeSessionExpiration(),
  };

  return { user, session };
};

/**
 * logout
 *
 * Invalidates a single session.
 */
exports.logout = async ({ sessionToken }) => {
  if (!sessionToken) {
    throw new Error("sessionToken is required");
  }

  // TODO (DB layer):
  // - invalidate session by token
};

/**
 * getSessionContext
 *
 * Validates a session token and returns user + session.
 * Used exclusively by auth middleware.
 */
exports.getSessionContext = async ({ sessionToken }) => {
  if (!sessionToken) {
    throw new Error("sessionToken is required");
  }

  // TODO (DB layer):
  // - load session by token
  // - verify active + not expired
  // - load user
  // - update last activity

  const user = null; // placeholder
  const session = null; // placeholder

  return { user, session };
};

/**
 * changePassword
 *
 * Changes password for authenticated user.
 */
exports.changePassword = async ({ userId, currentPassword, newPassword }) => {
  if (!userId || !currentPassword || !newPassword) {
    throw new Error("Missing password change fields");
  }

  // TODO (DB layer):
  // - verify current password
  // - hash new password
  // - update user
  // - invalidate other sessions
};
