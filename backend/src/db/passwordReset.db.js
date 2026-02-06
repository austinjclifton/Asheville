"use strict";

/**
 * Password Reset Repository
 *
 * Owns persistence for password reset tokens.
 */

const { query } = require("./pool");

exports.createOrReplace = async ({ userId, tokenHash, expiresAt }) => {
  return query(
    `
    INSERT INTO password_reset_token (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id)
    DO UPDATE SET
      token_hash = EXCLUDED.token_hash,
      expires_at = EXCLUDED.expires_at
    `,
    [userId, tokenHash, expiresAt],
  );
};

exports.findByTokenHash = async (tokenHash) => {
  const rows = await query(
    `
    SELECT user_id, token_hash, expires_at
    FROM password_reset_token
    WHERE token_hash = $1
    `,
    [tokenHash],
  );

  return rows[0] ?? null;
};

exports.deleteForUser = async (userId) => {
  await query(`DELETE FROM password_reset_token WHERE user_id = $1`, [userId]);
};
