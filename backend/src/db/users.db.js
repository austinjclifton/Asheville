/**
 * Users Repository
 * Table: beekeeper
 */

"use strict";

const { query } = require("./pool");

/* ================================================================
 * Core lookups
 * ================================================================ */

exports.findById = async (id) => {
  const rows = await query(
    `
    SELECT id, username, email, phone
    FROM beekeeper
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return rows[0] ?? null;
};

exports.findByEmail = async (email) => {
  const rows = await query(
    `
    SELECT *
    FROM beekeeper
    WHERE email = $1
    LIMIT 1
    `,
    [email]
  );

  return rows[0] ?? null;
};

exports.findByUsername = async (username) => {
  const rows = await query(
    `
    SELECT *
    FROM beekeeper
    WHERE username = $1
    LIMIT 1
    `,
    [username]
  );

  return rows[0] ?? null;
};

/* ================================================================
 * Creation
 * ================================================================ */

exports.create = async ({ username, email, passwordHash }) => {
  const rows = await query(
    `
    INSERT INTO beekeeper (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, phone
    `,
    [username, email, passwordHash]
  );

  return rows[0];
};

/* ================================================================
 * Password management
 * ================================================================ */

exports.updatePasswordHash = async (id, passwordHash) => {
  await query(
    `
    UPDATE beekeeper
    SET password_hash = $2
    WHERE id = $1
    `,
    [id, passwordHash]
  );
};

exports.findAuthById = async (id) => {
  const rows = await query(
    `
    SELECT *
    FROM beekeeper
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return rows[0] ?? null;
};
