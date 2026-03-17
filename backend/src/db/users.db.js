"use strict";

/**
 * Users Repository
 * Table: beekeeper
 */

const { query } = require("./pool");

/* ========================================================================== */
/* Column sets                                                                 */
/* ========================================================================== */

const BASE_COLUMNS = `
  id,
  username,
  email,
  phone,
  created_at,
  updated_at
`;

const AUTH_COLUMNS = `
  ${BASE_COLUMNS},
  password_hash
`;

const LOOKUP_COLUMN = Object.freeze({
  id: "id",
  email: "email",
  username: "username",
});

/* ========================================================================== */
/* Private helpers                                                             */
/* ========================================================================== */

/**
 * Find a single beekeeper row by a whitelisted column.
 */
async function findOneBy({ columnKey, value, includeAuth = false }) {
  const column = LOOKUP_COLUMN[columnKey];
  if (!column) {
    throw new Error("Invalid lookup column");
  }

  const columns = includeAuth ? AUTH_COLUMNS : BASE_COLUMNS;

  const rows = await query(
    `
    SELECT ${columns}
    FROM beekeeper
    WHERE ${column} = $1
    LIMIT 1
    `,
    [value],
  );

  return rows[0] ?? null;
}

/* ========================================================================== */
/* Reads                                                                       */
/* ========================================================================== */

/**
 * Lookups (public projection).
 */
exports.findById = async ({ id }) => {
  return findOneBy({ columnKey: "id", value: id });
};

exports.findByEmail = async ({ email }) => {
  return findOneBy({ columnKey: "email", value: email });
};

exports.findByUsername = async ({ username }) => {
  return findOneBy({ columnKey: "username", value: username });
};

/**
 * Lookups (auth projection).
 */
exports.findAuthById = async ({ id }) => {
  return findOneBy({ columnKey: "id", value: id, includeAuth: true });
};

exports.findAuthByEmail = async ({ email }) => {
  return findOneBy({ columnKey: "email", value: email, includeAuth: true });
};

exports.findAuthByUsername = async ({ username }) => {
  return findOneBy({
    columnKey: "username",
    value: username,
    includeAuth: true,
  });
};

/* ========================================================================== */
/* Writes                                                                      */
/* ========================================================================== */

/**
 * Create a new beekeeper.
 */
exports.create = async ({ username, email, passwordHash }) => {
  const rows = await query(
    `
    INSERT INTO beekeeper (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING ${BASE_COLUMNS}
    `,
    [username, email, passwordHash],
  );

  return rows[0] ?? null;
};

/**
 * Update password hash for a beekeeper.
 * Returns true if a row was updated.
 */
exports.updatePasswordHash = async ({ id, passwordHash }) => {
  const rows = await query(
    `
    UPDATE beekeeper
    SET password_hash = $2,
        updated_at = now()
    WHERE id = $1
    RETURNING id
    `,
    [id, passwordHash],
  );

  return rows.length === 1;
};

/**
 * Delete a beekeeper by id.
 * Returns true if a row was deleted.
 */
exports.deleteById = async ({ id }) => {
  const rows = await query(
    `
    DELETE FROM beekeeper
    WHERE id = $1
    RETURNING id
    `,
    [id],
  );

  return rows.length === 1;
};
