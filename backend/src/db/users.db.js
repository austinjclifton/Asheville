"use strict";

/**
 * Users Repository
 * Table: beekeeper
 *
 * Responsibilities:
 * - Persist and retrieve beekeeper records
 * - Control which columns are exposed per use-case
 *
 * This repository:
 * - Knows SQL
 * - Knows table structure
 * - Does NOT know business rules
 */

const { query } = require("./pool");

/* ================================================================
 * Column definitions
 * ================================================================ */

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

/* ================================================================
 * Internal helpers
 * ================================================================ */

async function findOneBy({ column, value, includeAuth = false }) {
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

/* ================================================================
 * Lookups (public projections)
 * ================================================================ */

exports.findById = async (id) => {
  return findOneBy({
    column: "id",
    value: id,
  });
};

exports.findByEmail = async (email) => {
  return findOneBy({
    column: "email",
    value: email,
  });
};

exports.findByUsername = async (username) => {
  return findOneBy({
    column: "username",
    value: username,
  });
};

/* ================================================================
 * Lookups (auth projections)
 * ================================================================ */

exports.findAuthById = async (id) => {
  return findOneBy({
    column: "id",
    value: id,
    includeAuth: true,
  });
};

exports.findAuthByEmail = async (email) => {
  return findOneBy({
    column: "email",
    value: email,
    includeAuth: true,
  });
};

exports.findAuthByUsername = async (username) => {
  return findOneBy({
    column: "username",
    value: username,
    includeAuth: true,
  });
};

/* ================================================================
 * Creation
 * ================================================================ */

exports.create = async ({ username, email, passwordHash }) => {
  const rows = await query(
    `
    INSERT INTO beekeeper (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING ${BASE_COLUMNS}
    `,
    [username, email, passwordHash],
  );

  return rows[0];
};

/* ================================================================
 * Password management
 * ================================================================ */

exports.updatePasswordHash = async (id, passwordHash) => {
  const result = await query(
    `
    UPDATE beekeeper
    SET password_hash = $2,
        updated_at = now()
    WHERE id = $1
    `,
    [id, passwordHash],
  );

  return result.rowCount === 1;
};

/* ================================================================
 * Deletion
 * ================================================================ */

exports.deleteById = async (id) => {
  const result = await query(
    `
    DELETE FROM beekeeper
    WHERE id = $1
    `,
    [id],
  );

  return result.rowCount === 1;
};
