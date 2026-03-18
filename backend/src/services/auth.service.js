"use strict";

const bcrypt = require("bcrypt");

const usersRepo = require("../db/users.db");
const sessionService = require("./sessions.service.js");

/* ========================================================================== */
/* Config                                                                      */
/* ========================================================================== */

const BCRYPT_ROUNDS = 12;

const USERNAME_MIN = 3;
const USERNAME_MAX = 50;

const EMAIL_MAX = 254;
const IDENTIFIER_MAX = 254;

// bcrypt truncates at 72 bytes so we enforce <= 72 characters under ASCII assumption
// If you later allow unicode-heavy passwords, enforce by bytes not chars
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

/* ========================================================================== */
/* Public API                                                                  */
/* ========================================================================== */

exports.register = async ({ username, email, password, context }) => {
  const u = normalizeUsername(username);
  const e = normalizeEmail(email);
  const p = normalizePassword(password);

  validateUsername(u);
  validateEmail(e);
  validatePassword(p);

  // Fast deterministic pre-checks still rely on DB unique constraints for truth
  const [existingEmail, existingUsername] = await Promise.all([
    usersRepo.findByEmail({ email: e }),
    usersRepo.findByUsername({ username: u }),
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
    // Race-safe handling if username or email is created after pre-check
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

exports.changePassword = async ({ userId, currentPassword, newPassword }) => {
  validateUserId(userId);

  const current = normalizePassword(currentPassword);
  const next = normalizePassword(newPassword);

  validatePassword(current);
  validatePassword(next);

  if (current === next) {
    throw badRequest("New password must be different from current password");
  }

  const user = await usersRepo.findAuthById({ id: userId });
  if (!user) throw notFound("User not found");

  const ok = await bcrypt.compare(current, user.password_hash);
  if (!ok) throw unauthorized("Current password incorrect");

  const newHash = await bcrypt.hash(next, BCRYPT_ROUNDS);

  await usersRepo.updatePasswordHash({ id: userId, passwordHash: newHash });

  // Policy: invalidate all sessions after password change
  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });
};

exports.resetPassword = async ({ userId, newPassword }) => {
  validateUserId(userId);

  const next = normalizePassword(newPassword);
  validatePassword(next);

  const user = await usersRepo.findAuthById({ id: userId });
  if (!user) throw notFound("User not found");

  const newHash = await bcrypt.hash(next, BCRYPT_ROUNDS);

  await usersRepo.updatePasswordHash({ id: userId, passwordHash: newHash });

  // Policy: invalidate all sessions after password reset
  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });
};

exports.deleteUserAndSessions = async ({ userId, requesterId }) => {
  validateUserId(userId);
  validateUserId(requesterId);

  if (userId !== requesterId) throw forbidden("Cannot delete another user");

  // Keep behavior identical to your original file by enforcing existence check
  const user = await usersRepo.findById({ id: userId });
  if (!user) throw notFound("User not found");

  await sessionService.invalidateAllSessionsForUser({
    beekeeperId: Number(userId),
  });

  await usersRepo.deleteById({ id: userId });
};

/* ========================================================================== */
/* Identifier resolution                                                       */
/* ========================================================================== */

async function findAuthUserByIdentifier(identifier) {
  // Route by contains @ which is correct enough for login
  // Strict email validity is enforced during registration
  if (looksLikeEmail(identifier)) {
    return usersRepo.findAuthByEmail({ email: normalizeEmail(identifier) });
  }
  return usersRepo.findAuthByUsername({ username: identifier });
}

function looksLikeEmail(value) {
  return typeof value === "string" && value.includes("@");
}

/* ========================================================================== */
/* Normalization                                                               */
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
  // Do not trim passwords since whitespace may be intentional
  return password;
}

/* ========================================================================== */
/* Validation                                                                  */
/* ========================================================================== */

function validateUsername(username) {
  if (typeof username !== "string") throw badRequest("Invalid username");

  const u = username.trim();
  if (u.length < USERNAME_MIN || u.length > USERNAME_MAX) {
    throw badRequest(
      `Username must be between ${USERNAME_MIN} and ${USERNAME_MAX} characters`,
    );
  }

  // Policy: alnum plus dot underscore dash
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

  // Simple practical email check
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
    throw badRequest(`Password must be at most ${PASSWORD_MAX} characters`);
  }
}

/* ========================================================================== */
/* Public mapping                                                             */
/* ========================================================================== */

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
}

/* ========================================================================== */
/* Repo error mapping                                                          */
/* ========================================================================== */

function isUniqueViolation(err) {
  // Postgres unique violation
  // node-postgres uses err.code = 23505
  return Boolean(err && (err.code === "23505" || err.constraint));
}

/* ========================================================================== */
/* Error factories                                                             */
/* ========================================================================== */

function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function badRequest(message) {
  return httpError(400, "VALIDATION_ERROR", message);
}

function unauthorized(message) {
  return httpError(401, "UNAUTHORIZED", message);
}

function forbidden(message) {
  return httpError(403, "FORBIDDEN", message);
}

function notFound(message) {
  return httpError(404, "NOT_FOUND", message);
}

function conflict(message) {
  return httpError(409, "CONFLICT", message);
}
