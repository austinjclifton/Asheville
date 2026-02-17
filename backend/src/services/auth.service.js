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

/* ========================================================================== */
/* Config                                                                       */
/* ========================================================================== */

const BCRYPT_ROUNDS = 12;

// Policy constants
const USERNAME_MIN = 3;
const USERNAME_MAX = 50;
const EMAIL_MAX = 254;
const IDENTIFIER_MAX = 254;

// bcrypt truncates at 72 bytes; we enforce <= 72 chars (ASCII assumption).
// If you later allow unicode-heavy passwords, enforce by bytes not chars.
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

/* ========================================================================== */
/* Public API                                                                   */
/* ========================================================================== */

/**
 * Register a user and start a session.
 */
exports.register = async ({ username, email, password, context }) => {
  const u = normalizeUsername(username);
  const e = normalizeEmail(email);
  const p = normalizePassword(password);

  validateUsername(u);
  validateEmail(e);
  validatePassword(p);

  // Fast deterministic pre-checks (still must rely on DB unique constraints).
  const [existingEmail, existingUsername] = await Promise.all([
    usersRepo.findByEmail(e),
    usersRepo.findByUsername(u),
  ]);

  if (existingEmail) throw conflict("Email already in use");
  if (existingUsername) throw conflict("Username already in use");

  const passwordHash = await bcrypt.hash(p, BCRYPT_ROUNDS);

  let user;
  try {
    user = await usersRepo.create({
      username: u,
      email: e,
      passwordHash,
    });
  } catch (err) {
    // Race-safe: if another request created same username/email after our precheck
    if (isUniqueViolation(err)) {
      throw conflict("Username or email already in use");
    }
    throw err;
  }

  const session = await sessionService.createSession({
    beekeeperId: Number(user.id),
    context,
  });

  return { user: toPublicUser(user), session };
};

/**
 * Authenticate and start a session.
 */
exports.login = async ({ identifier, password, context }) => {
  const ident = normalizeIdentifier(identifier);
  const p = normalizePassword(password);

  validateIdentifier(ident);
  validatePassword(p);

  const user = await findAuthUserByIdentifier(ident);
  if (!user) throw unauthorized("Invalid credentials");

  const ok = await bcrypt.compare(p, user.password_hash);
  if (!ok) throw unauthorized("Invalid credentials");

  const session = await sessionService.createSession({
    beekeeperId: Number(user.id),
    context,
  });

  return { user: toPublicUser(user), session };
};

/**
 * Change password for an authenticated user.
 * Policy: invalidate all sessions after change.
 */
exports.changePassword = async ({ userId, currentPassword, newPassword }) => {
  validateUserId(userId);

  const current = normalizePassword(currentPassword);
  const next = normalizePassword(newPassword);

  validatePassword(current);
  validatePassword(next);

  if (current === next) {
    throw badRequest("New password must be different from current password");
  }

  const user = await usersRepo.findAuthById(userId);
  if (!user) throw notFound("User not found");

  const ok = await bcrypt.compare(current, user.password_hash);
  if (!ok) throw unauthorized("Current password incorrect");

  const newHash = await bcrypt.hash(next, BCRYPT_ROUNDS);

  await usersRepo.updatePasswordHash(userId, newHash);

  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });
};

/**
 * Reset password for a user (token verification handled elsewhere).
 * Policy: invalidate all sessions after reset.
 */
exports.resetPassword = async ({ userId, newPassword }) => {
  validateUserId(userId);

  const next = normalizePassword(newPassword);
  validatePassword(next);

  const user = await usersRepo.findAuthById(userId);
  if (!user) throw notFound("User not found");

  const newHash = await bcrypt.hash(next, BCRYPT_ROUNDS);

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

  if (userId !== requesterId) throw forbidden("Cannot delete another user");

  // Optional strictness: ensure user exists (more honest for clients).
  // If you prefer idempotent delete, remove this and just deleteById.
  const user = await usersRepo.findById(userId);
  if (!user) throw notFound("User not found");

  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });

  await usersRepo.deleteById(userId);
};

/* ========================================================================== */
/* Identifier Resolution                                                        */
/* ========================================================================== */

async function findAuthUserByIdentifier(identifier) {
  // Route by "contains @" (simple, correct enough for login)
  // Detailed email validity is enforced for registration, not login routing.
  if (looksLikeEmail(identifier)) {
    return usersRepo.findAuthByEmail(normalizeEmail(identifier));
  }
  return usersRepo.findAuthByUsername(identifier);
}

function looksLikeEmail(value) {
  return typeof value === "string" && value.includes("@");
}

/* ========================================================================== */
/* Normalization                                                                */
/* ========================================================================== */

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

function normalizePassword(password) {
  // Do NOT trim passwords; spaces may be intentional.
  return password;
}

/* ========================================================================== */
/* Validation                                                                   */
/* ========================================================================== */

function validateUsername(username) {
  if (typeof username !== "string") throw badRequest("Invalid username");

  const u = username.trim();
  if (u.length < USERNAME_MIN || u.length > USERNAME_MAX) {
    throw badRequest(
      `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters`
    );
  }

  // Keep policy explicit: alnum + . _ -
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

  // Simple but practical email check
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
  if (typeof password !== "string") throw badRequest("Invalid password");

  if (password.length < PASSWORD_MIN) {
    throw badRequest(`Password must be at least ${PASSWORD_MIN} characters`);
  }

  if (password.length > PASSWORD_MAX) {
    throw badRequest(
      `Password must be at most ${PASSWORD_MAX} characters (bcrypt limit)`
    );
  }
}

/* ========================================================================== */
/* Public mapping                                                               */
/* ========================================================================== */

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

/* ========================================================================== */
/* Repo error mapping                                                           */
/* ========================================================================== */

function isUniqueViolation(err) {
  // Postgres unique violation
  // - node-postgres sets err.code = '23505'
  // If you swap DBs, update here (service remains stable).
  return err && (err.code === "23505" || err.constraint);
}

/* ========================================================================== */
/* Error factories                                                              */
/* ========================================================================== */

function badRequest(message) {
  return httpError(400, message);
}

function unauthorized(message) {
  return httpError(401, message);
}

function forbidden(message) {
  return httpError(403, message);
}

function notFound(message) {
  return httpError(404, message);
}

function conflict(message) {
  return httpError(409, message);
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
