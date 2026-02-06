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

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

const TOKEN_BYTES = 32;
const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

/* -------------------------------------------------------------------------- */
/* Utilities                                                                   */
/* -------------------------------------------------------------------------- */

function now() {
  return new Date();
}

function generateToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function isExpired(expiresAt) {
  return new Date(expiresAt) <= now();
}

/* -------------------------------------------------------------------------- */
/* Internal API                                                                */
/* -------------------------------------------------------------------------- */

/**
 * createResetToken
 *
 * Generates and stores a new reset token for a user.
 * Replaces any existing reset token for that user.
 *
 * @returns rawToken (returned ONCE)
 */
async function createResetToken({ userId }) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid userId");
  }

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

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * requestResetForEmail
 *
 * Public-facing reset request flow.
 * - Never leaks whether a user exists
 * - Always returns successfully
 */
exports.requestResetForEmail = async ({ email }) => {
  if (typeof email !== "string") {
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  const user = await usersRepo.findByEmail(normalizedEmail);
  if (!user) {
    // Intentional: prevent account enumeration
    return;
  }

  const rawToken = await createResetToken({
    userId: Number(user.id),
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("Password reset token:", rawToken);
  }

  // Future: send email here
};

/**
 * verifyResetToken
 *
 * Verifies token validity WITHOUT consuming it.
 * Safe to call multiple times.
 */
exports.verifyResetToken = async ({ rawToken }) => {
  if (typeof rawToken !== "string" || rawToken.trim() === "") {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const row = await passwordResetRepo.findByTokenHash(tokenHash);

  if (!row) return null;
  if (isExpired(row.expires_at)) return null;

  return {
    userId: Number(row.user_id),
  };
};

/**
 * consumeResetTokenForUser
 *
 * Consumes (deletes) any reset token for the given user.
 * Should ONLY be called after a successful password reset.
 */
exports.consumeResetTokenForUser = async ({ userId }) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid userId");
  }

  await passwordResetRepo.deleteForUser(userId);
};
