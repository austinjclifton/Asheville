"use strict";

/**
 * Sessions Repository
 *
 * Responsibilities:
 * - Persist session records
 * - Retrieve and mutate session state
 * - Enforce data-level session invariants
 *
 * This repository:
 * - Knows SQL
 * - Knows table structure
 * - Does NOT know business rules
 */

const { query } = require("./pool");

/* ================================================================
 * Creation
 * ================================================================ */

exports.create = async ({
  beekeeperId,
  sessionToken,
  csrfToken,
  expiresAt,
}) => {
  const rows = await query(
    `
    INSERT INTO "session" (
      beekeeper_id,
      session_token,
      csrf_token,
      expires_at,
      active,
      created_at,
      last_activity_at
    )
    VALUES ($1, $2, $3, $4, TRUE, now(), now())
    RETURNING *
    `,
    [beekeeperId, sessionToken, csrfToken, expiresAt]
  );

  return rows[0];
};

/* ================================================================
 * Lookups
 * ================================================================ */

exports.findByToken = async (sessionToken) => {
  const rows = await query(
    `
    SELECT *
    FROM "session"
    WHERE session_token = $1
    LIMIT 1
    `,
    [sessionToken]
  );

  return rows[0] ?? null;
};

exports.findById = async (sessionId) => {
  const rows = await query(
    `
    SELECT *
    FROM "session"
    WHERE id = $1
    LIMIT 1
    `,
    [sessionId]
  );

  return rows[0] ?? null;
};

/* ================================================================
 * Invalidation
 * ================================================================ */

exports.invalidate = async (sessionId) => {
  await query(
    `
    UPDATE "session"
    SET active = FALSE
    WHERE id = $1
    `,
    [sessionId]
  );
};

exports.invalidateAllForBeekeeper = async (beekeeperId) => {
  await query(
    `
    UPDATE "session"
    SET active = FALSE
    WHERE beekeeper_id = $1
    `,
    [beekeeperId]
  );
};

/* ================================================================
 * Activity tracking
 * ================================================================ */

exports.touch = async (sessionId) => {
  await query(
    `
    UPDATE "session"
    SET last_activity_at = now()
    WHERE id = $1
    `,
    [sessionId]
  );
};
