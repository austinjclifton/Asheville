"use strict";

/**
 * Auth Service
 *
 * Responsibilities:
 * - Own authentication flows (register, login, change password, reset password)
 * - Enforce auth-related business rules
 * - Delegate session lifecycle actions to SessionService
 *
 * This service:
 * - Is HTTP-agnostic
 * - Does NOT manage cookies
 * - Does NOT validate sessions for middleware
 * - Does NOT read/write session storage directly (delegates to SessionService)
 */

const bcrypt = require("bcrypt");

const usersRepo = require("../db/users.db");
const sessionService = require("./sessions.service.js");

const BCRYPT_ROUNDS = 12;

// Reasonable baselines (tune later if needed)
const USERNAME_MIN = 3;
const USERNAME_MAX = 50;
const EMAIL_MAX = 254;
const IDENTIFIER_MAX = 254;

/* ================================================================
 * Register
 * ================================================================ */

exports.register = async ({ username, email, password, context }) => {
  const u = normalizeUsername(username);
  const e = normalizeEmail(email);

  validateUsername(u);
  validateEmail(e);
  validatePassword(password);

  const existingEmail = await usersRepo.findByEmail(e);
  if (existingEmail) throw conflict("Email already in use");

  const existingUsername = await usersRepo.findByUsername(u);
  if (existingUsername) throw conflict("Username already in use");

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await usersRepo.create({
    username: u,
    email: e,
    passwordHash,
  });

  const session = await sessionService.createSession({
    beekeeperId: Number(user.id),
    context,
  });

  return {
    user: toPublicUser(user),
    session,
  };
};

/* ================================================================
 * Login
 * ================================================================ */

exports.login = async ({ identifier, password, context }) => {
  const ident = normalizeIdentifier(identifier);

  validateIdentifier(ident);
  validatePassword(password);

  // Resolve user in a deterministic way
  let user = null;

  if (isEmail(ident)) {
    user = await usersRepo.findAuthByEmail(normalizeEmail(ident));
  } else {
    user = await usersRepo.findAuthByUsername(ident);
  }

  // Single failure path to avoid drift
  if (!user) {
    throw unauthorized("Invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw unauthorized("Invalid credentials");
  }

  const session = await sessionService.createSession({
    beekeeperId: Number(user.id),
    context,
  });

  return {
    user: toPublicUser(user),
    session,
  };
};

/* ================================================================
 * Change password
 * ================================================================ */

exports.changePassword = async ({ userId, currentPassword, newPassword }) => {
  validateUserId(userId);
  validatePassword(currentPassword);
  validatePassword(newPassword);

  const user = await usersRepo.findAuthById(userId);
  if (!user) throw notFound("User not found");

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw unauthorized("Current password incorrect");

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await usersRepo.updatePasswordHash(userId, newHash);

  // Security rule: changing password invalidates all sessions
  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });
};

/* ================================================================
 * Reset password
 * ================================================================ */

exports.resetPassword = async ({ userId, newPassword }) => {
  validateUserId(userId);
  validatePassword(newPassword);

  const user = await usersRepo.findAuthById(userId);
  if (!user) throw notFound("User not found");

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await usersRepo.updatePasswordHash(userId, newHash);

  // Security rule: reset invalidates all sessions
  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });
};

/* ================================================================
 * Delete self account (and all sessions)
 * ================================================================ */

/**
 * deleteUserAndSessions
 *
 * Current policy (intentionally minimal):
 * - Users may only delete their own account (no roles/admin yet)
 *
 * Guarantees:
 * - 404 if target user does not exist
 * - 403 if requester attempts to delete someone else
 * - Sessions are invalidated via SessionService (no direct repo access)
 *
 * @param {Object} params
 * @param {number} params.userId - The user to delete
 * @param {number} params.requesterId - The user making the request
 * @returns {Promise<void>}
 */
exports.deleteUserAndSessions = async ({ userId, requesterId }) => {
  validateUserId(userId);
  validateUserId(requesterId);

  if (userId !== requesterId) {
    throw forbidden("Cannot delete another user");
  }

  // Invalidate sessions first (safe even if user is already gone)
  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });

  // Attempt delete; treat missing user as success (idempotent)
  await usersRepo.deleteById(userId);

  // Always succeed
  return;
};

/* ================================================================
 * Validation + Normalization
 * ================================================================ */

function normalizeUsername(username) {
  if (typeof username !== "string") return username;
  return username.trim();
}

function normalizeEmail(email) {
  if (typeof email !== "string") return email;
  return email.trim().toLowerCase();
}

function normalizeIdentifier(identifier) {
  if (typeof identifier !== "string") return identifier;
  return identifier.trim();
}

function validateUsername(username) {
  if (typeof username !== "string") throw badRequest("Invalid username");

  const u = username.trim();
  if (u.length < USERNAME_MIN || u.length > USERNAME_MAX) {
    throw badRequest(
      `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters`,
    );
  }

  // Conservative: letters, numbers, underscore, hyphen, dot
  // (adjust later if you want spaces, etc.)
  if (!/^[a-zA-Z0-9._-]+$/.test(u)) {
    throw badRequest("Username contains invalid characters");
  }
}

function validateEmail(email) {
  if (typeof email !== "string") throw badRequest("Invalid email");

  const e = email.trim();
  if (e.length === 0 || e.length > EMAIL_MAX) {
    throw badRequest("Invalid email");
  }

  // Practical email validation (not perfect RFC, but robust enough)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw badRequest("Invalid email");
  }
}

function validateIdentifier(identifier) {
  if (typeof identifier !== "string") throw badRequest("Invalid identifier");

  const ident = identifier.trim();
  if (ident.length === 0 || ident.length > IDENTIFIER_MAX) {
    throw badRequest("Invalid identifier");
  }
}

function validateUserId(userId) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw badRequest("Invalid user id");
  }
}

function validatePassword(password) {
  if (typeof password !== "string") {
    throw badRequest("Invalid password");
  }

  if (password.length < 8) {
    throw badRequest("Password must be at least 8 characters");
  }

  // bcrypt truncates after 72 bytes; enforce to prevent user confusion
  if (password.length > 72) {
    throw badRequest("Password must be at most 72 characters (bcrypt limit)");
  }
}

function isEmail(value) {
  if (typeof value !== "string") return false;

  const v = value.trim();
  const at = v.indexOf("@");

  // must contain exactly one "@" not at the start or end
  if (at <= 0 || at !== v.lastIndexOf("@")) return false;
  if (at === v.length - 1) return false;

  // domain must contain a dot after "@" and not at the end
  const lastDot = v.lastIndexOf(".");
  if (lastDot <= at + 1) return false;

  // rules: must be 1-3 chars, must be at the end
  const tldLength = v.length - lastDot - 1;
  if (tldLength < 1 || tldLength > 3) return false;

  return true;
}

/* ================================================================
 * Mapping helpers
 * ================================================================ */

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

/* ================================================================
 * Error factories
 * ================================================================ */

function badRequest(message) {
  return error(400, message);
}

function unauthorized(message) {
  return error(401, message);
}

function forbidden(message) {
  return error(403, message);
}

function notFound(message) {
  return error(404, message);
}

function conflict(message) {
  return error(409, message);
}

function error(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
