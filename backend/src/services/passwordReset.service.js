"use strict";

/**
 * Password Reset Service
 *
 * Responsibilities:
 * - Generate and persist reset tokens
 * - Verify token validity (without consuming)
 * - Consume tokens after successful password reset
 *
 * Security guarantees:
 * - Tokens are single-use
 * - Tokens expire automatically
 * - Reset requests never leak account existence
 */

const crypto = require("crypto");

const usersRepo = require("../db/users.db.js");
const passwordResetRepo = require("../db/passwordReset.db.js");

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Return current time (isolated for testability).
 */
function now() {
  return new Date();
}

/**
 * Generate a cryptographically secure random token (raw).
 */
function generateToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

/**
 * Hash a raw token for storage/lookup.
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Check whether an expiry timestamp is in the past.
 */
function isExpired(expiresAt) {
  return new Date(expiresAt) <= now();
}

/**
 * Validate a positive integer id.
 */
function assertPositiveInt(value, field) {
  if (!Number.isInteger(value) || value <= 0) {
    const err = new Error(`Invalid ${field}`);
    err.status = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }
}

/**
 * Generate and store a new reset token for a user (replaces any existing token).
 * Returns the raw token (returned once to the caller for delivery).
 */
async function createResetToken({ userId }) {
  assertPositiveInt(userId, "userId");

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(now().getTime() + TOKEN_TTL_MS);

  await passwordResetRepo.createOrReplace({
    userId,
    tokenHash,
    expiresAt,
  });

  return rawToken;
}

/**
 * Request a password reset for an email.
 * Always succeeds without revealing whether the account exists.
 */
exports.requestResetForEmail = async ({ email }) => {
  // Ignore non-string or blank emails to preserve non-enumeration behavior.
  if (typeof email !== "string") return;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  const user = await usersRepo.findByEmail(normalizedEmail);
  if (!user) {
    // Intentional: prevent account enumeration.
    return;
  }

  const rawToken = await createResetToken({ userId: Number(user.id) });

  // Non-production convenience to test flows without email delivery.
  if (process.env.NODE_ENV !== "production") {
    console.log("Password reset token:", rawToken);
  }

  // Future: send email/SMS here.
};

/**
 * Verify token validity without consuming it (safe to call multiple times).
 * Returns { userId } on success, otherwise null.
 */
exports.verifyResetToken = async ({ rawToken }) => {
  if (typeof rawToken !== "string" || rawToken.trim() === "") {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const row = await passwordResetRepo.findByTokenHash(tokenHash);

  if (!row) return null;
  if (isExpired(row.expires_at)) return null;

  return { userId: Number(row.user_id) };
};

/**
 * Consume (delete) any reset token for the given user.
 * Call only after a successful password reset.
 */
exports.consumeResetTokenForUser = async ({ userId }) => {
  assertPositiveInt(userId, "userId");
  await passwordResetRepo.deleteForUser(userId);
};
