"use strict";

/**
 * Sessions Repository
 * Table: "session"
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
 *
 * Note:
 * - Table name is quoted because "session" is a reserved keyword in SQL.
 */

const { query } = require("./pool");

/* ================================================================
 * Column definitions
 * ================================================================ */

const BASE_COLUMNS = `
  id,
  beekeeper_id,
  expires_at,
  active,
  created_at,
  last_activity_at
`;

const AUTH_COLUMNS = `
  ${BASE_COLUMNS},
  session_token,
  csrf_token
`;

/* ================================================================
 * Internal helpers
 * ================================================================ */

async function findOneBy({ column, value, columns }) {
  const rows = await query(
    `
    SELECT ${columns}
    FROM "session"
    WHERE ${column} = $1
    LIMIT 1
    `,
    [value],
  );

  return rows[0] ?? null;
}

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
    RETURNING ${AUTH_COLUMNS}
    `,
    [beekeeperId, sessionToken, csrfToken, expiresAt],
  );

  return rows[0];
};

/* ================================================================
 * Lookups
 * ================================================================ */

exports.findById = async (sessionId) => {
  return findOneBy({
    column: "id",
    value: sessionId,
    columns: BASE_COLUMNS,
  });
};

exports.findByToken = async (sessionToken) => {
  return findOneBy({
    column: "session_token",
    value: sessionToken,
    columns: AUTH_COLUMNS,
  });
};

/* ================================================================
 * Invalidation (soft delete)
 * ================================================================ */

exports.invalidate = async (sessionId) => {
  const result = await query(
    `
    UPDATE "session"
    SET active = FALSE
    WHERE id = $1
    `,
    [sessionId],
  );

  return result.rowCount === 1;
};

exports.invalidateAllForBeekeeper = async (beekeeperId) => {
  const result = await query(
    `
    UPDATE "session"
    SET active = FALSE
    WHERE beekeeper_id = $1
    `,
    [beekeeperId],
  );

  return result.rowCount > 0;
};

/* ================================================================
 * Deletion (hard delete)
 * ================================================================ */

exports.deleteAllForBeekeeper = async (beekeeperId) => {
  const result = await query(
    `
    DELETE FROM "session"
    WHERE beekeeper_id = $1
    `,
    [beekeeperId],
  );

  return result.rowCount > 0;
};

/* ================================================================
 * Activity tracking
 * ================================================================ */

exports.touch = async (sessionId) => {
  const result = await query(
    `
    UPDATE "session"
    SET last_activity_at = now()
    WHERE id = $1
    `,
    [sessionId],
  );

  return result.rowCount === 1;
};
