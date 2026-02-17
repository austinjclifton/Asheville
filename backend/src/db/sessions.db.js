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
 * Notes:
 * - Table name is quoted because "session" is reserved in SQL.
 * - This layer knows SQL and table shape, not business rules.
 */

const { query } = require("./pool");

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

const LOOKUP_COLUMN = Object.freeze({
  id: "id",
  sessionToken: "session_token",
});

/**
 * Find a single session row by a whitelisted column.
 */
async function findOneBy({ columnKey, value, columns }) {
  const column = LOOKUP_COLUMN[columnKey];
  if (!column) {
    throw new Error("Invalid lookup column");
  }

  const rows = await query(
    `
    SELECT ${columns}
    FROM "session"
    WHERE ${column} = $1
    LIMIT 1
    `,
    [value]
  );

  return rows[0] ?? null;
}

/**
 * Create a new session record.
 */
exports.create = async ({ beekeeperId, sessionToken, csrfToken, expiresAt }) => {
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
    [beekeeperId, sessionToken, csrfToken, expiresAt]
  );

  return rows[0] ?? null;
};

/**
 * Look up a session by id (non-sensitive projection).
 */
exports.findById = async (sessionId) => {
  return findOneBy({
    columnKey: "id",
    value: sessionId,
    columns: BASE_COLUMNS,
  });
};

/**
 * Look up a session by token (auth projection).
 */
exports.findByToken = async (sessionToken) => {
  return findOneBy({
    columnKey: "sessionToken",
    value: sessionToken,
    columns: AUTH_COLUMNS,
  });
};

/**
 * Soft-invalidate a session (active=false).
 * Returns true if a row was updated.
 */
exports.invalidate = async (sessionId) => {
  const rows = await query(
    `
    UPDATE "session"
    SET active = FALSE
    WHERE id = $1
    RETURNING id
    `,
    [sessionId]
  );

  return rows.length === 1;
};

/**
 * Soft-invalidate all sessions for a beekeeper.
 * Returns true if at least one row was updated.
 */
exports.invalidateAllForBeekeeper = async (beekeeperId) => {
  const rows = await query(
    `
    UPDATE "session"
    SET active = FALSE
    WHERE beekeeper_id = $1
    RETURNING id
    `,
    [beekeeperId]
  );

  return rows.length > 0;
};

/**
 * Hard-delete all sessions for a beekeeper.
 * Returns true if at least one row was deleted.
 */
exports.deleteAllForBeekeeper = async (beekeeperId) => {
  const rows = await query(
    `
    DELETE FROM "session"
    WHERE beekeeper_id = $1
    RETURNING id
    `,
    [beekeeperId]
  );

  return rows.length > 0;
};

/**
 * Update last-activity timestamp for a session.
 * Returns true if a row was updated.
 */
exports.touch = async (sessionId) => {
  const rows = await query(
    `
    UPDATE "session"
    SET last_activity_at = now()
    WHERE id = $1
    RETURNING id
    `,
    [sessionId]
  );

  return rows.length === 1;
};
