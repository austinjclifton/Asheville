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

const USERNAME_MIN = 3;
const USERNAME_MAX = 50;
const EMAIL_MAX = 254;
const IDENTIFIER_MAX = 254;

/**
 * POST-like: Create a user and start a session.
 */
exports.register = async ({ username, email, password, context }) => {
  const u = normalizeUsername(username);
  const e = normalizeEmail(email);

  validateUsername(u);
  validateEmail(e);
  validatePassword(password);

  // Avoid two separate round-trips when possible (deterministic checks).
  const [existingEmail, existingUsername] = await Promise.all([
    usersRepo.findByEmail(e),
    usersRepo.findByUsername(u),
  ]);

  if (existingEmail) throw conflict("Email already in use");
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

  return { user: toPublicUser(user), session };
};

/**
 * POST-like: Authenticate and start a session.
 */
exports.login = async ({ identifier, password, context }) => {
  const ident = normalizeIdentifier(identifier);

  validateIdentifier(ident);
  validatePassword(password);

  const user = await findAuthUserByIdentifier(ident);
  if (!user) {
    throw unauthorized("Invalid credentials");
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw unauthorized("Invalid credentials");
  }

  const session = await sessionService.createSession({
    beekeeperId: Number(user.id),
    context,
  });

  return { user: toPublicUser(user), session };
};

/**
 * Change password for an authenticated user.
 * Security policy: invalidate all sessions after change.
 */
exports.changePassword = async ({ userId, currentPassword, newPassword }) => {
  validateUserId(userId);
  validatePassword(currentPassword);
  validatePassword(newPassword);

  const user = await usersRepo.findAuthById(userId);
  if (!user) throw notFound("User not found");

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) throw unauthorized("Current password incorrect");

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Apply update + session invalidation; if either fails, bubble error.
  await usersRepo.updatePasswordHash(userId, newHash);

  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });
};

/**
 * Reset password for a user (token verification handled elsewhere).
 * Security policy: invalidate all sessions after reset.
 */
exports.resetPassword = async ({ userId, newPassword }) => {
  validateUserId(userId);
  validatePassword(newPassword);

  const user = await usersRepo.findAuthById(userId);
  if (!user) throw notFound("User not found");

  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await usersRepo.updatePasswordHash(userId, newHash);

  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });
};

/**
 * Delete the authenticated user's account and invalidate all sessions.
 * Policy: users may only delete themselves (no admin/roles).
 */
exports.deleteUserAndSessions = async ({ userId, requesterId }) => {
  validateUserId(userId);
  validateUserId(requesterId);

  if (userId !== requesterId) {
    throw forbidden("Cannot delete another user");
  }

  // Invalidate sessions first (safe even if user is already gone).
  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });

  // Idempotent delete (repo can treat missing as no-op).
  await usersRepo.deleteById(userId);
};

/**
 * Resolve an auth user row by identifier (email or username).
 */
async function findAuthUserByIdentifier(identifier) {
  if (isEmail(identifier)) {
    return usersRepo.findAuthByEmail(normalizeEmail(identifier));
  }
  return usersRepo.findAuthByUsername(identifier);
}

/**
 * Normalize username input.
 */
function normalizeUsername(username) {
  if (typeof username !== "string") return username;
  return username.trim();
}

/**
 * Normalize email input.
 */
function normalizeEmail(email) {
  if (typeof email !== "string") return email;
  return email.trim().toLowerCase();
}

/**
 * Normalize login identifier input.
 */
function normalizeIdentifier(identifier) {
  if (typeof identifier !== "string") return identifier;
  return identifier.trim();
}

/**
 * Validate username policy.
 */
function validateUsername(username) {
  if (typeof username !== "string") throw badRequest("Invalid username");

  const u = username.trim();
  if (u.length < USERNAME_MIN || u.length > USERNAME_MAX) {
    throw badRequest(
      `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters`
    );
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(u)) {
    throw badRequest("Username contains invalid characters");
  }
}

/**
 * Validate email policy.
 */
function validateEmail(email) {
  if (typeof email !== "string") throw badRequest("Invalid email");

  const e = email.trim();
  if (e.length === 0 || e.length > EMAIL_MAX) {
    throw badRequest("Invalid email");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    throw badRequest("Invalid email");
  }
}

/**
 * Validate identifier policy (username or email).
 */
function validateIdentifier(identifier) {
  if (typeof identifier !== "string") throw badRequest("Invalid identifier");

  const ident = identifier.trim();
  if (ident.length === 0 || ident.length > IDENTIFIER_MAX) {
    throw badRequest("Invalid identifier");
  }
}

/**
 * Validate user id.
 */
function validateUserId(userId) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw badRequest("Invalid user id");
  }
}

/**
 * Validate password policy (bcrypt truncation safety included).
 */
function validatePassword(password) {
  if (typeof password !== "string") {
    throw badRequest("Invalid password");
  }

  if (password.length < 8) {
    throw badRequest("Password must be at least 8 characters");
  }

  if (password.length > 72) {
    throw badRequest("Password must be at most 72 characters (bcrypt limit)");
  }
}

/**
 * Lightweight email classifier for identifier routing.
 */
function isEmail(value) {
  if (typeof value !== "string") return false;

  const v = value.trim();
  const at = v.indexOf("@");

  if (at <= 0 || at !== v.lastIndexOf("@")) return false;
  if (at === v.length - 1) return false;

  const lastDot = v.lastIndexOf(".");
  if (lastDot <= at + 1) return false;

  const tldLength = v.length - lastDot - 1;
  if (tldLength < 1 || tldLength > 3) return false;

  return true;
}

/**
 * Map DB row to public user shape.
 */
function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

/**
 * Error factories (service-layer HTTP semantics via status codes).
 */
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
