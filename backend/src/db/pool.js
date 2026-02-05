"use strict";

/**
 * Database Connection Pool (PostgreSQL)
 *
 * Responsibilities:
 * - Maintain a shared pool of PostgreSQL connections
 * - Reuse connections across queries
 * - Enforce a maximum number of concurrent DB connections
 * - Provide a thin query interface for repositories
 * - Support explicit transactions when needed
 *
 * This file intentionally:
 * - Contains NO business logic
 * - Contains NO SQL beyond connection-level concerns
 */

const { Pool } = require("pg");

/* -------------------------------------------------------------------------- */
/* Pool Configuration                                                         */
/* -------------------------------------------------------------------------- */

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Production-safe defaults
  max: 10, // max concurrent connections
  idleTimeoutMillis: 30_000, // close idle clients after 30s
  connectionTimeoutMillis: 5_000, // fail fast if DB is unreachable
});

/* -------------------------------------------------------------------------- */
/* Query Helper                                                               */
/* -------------------------------------------------------------------------- */

/**
 * query
 *
 * Thin wrapper around pool.query so repositories
 * never touch the pool directly.
 *
 * @param {string} text   - SQL query with $1, $2 placeholders
 * @param {Array} params  - Query parameters
 * @returns {Array} rows
 */
async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

/* -------------------------------------------------------------------------- */
/* Transaction Helper                                                         */
/* -------------------------------------------------------------------------- */

/**
 * getClient
 *
 * Used for explicit transactions:
 *
 * const client = await getClient();
 * try {
 *   await client.query("BEGIN");
 *   ...
 *   await client.query("COMMIT");
 * } catch (err) {
 *   await client.query("ROLLBACK");
 *   throw err;
 * } finally {
 *   client.release();
 * }
 */
async function getClient() {
  return pool.connect();
}

/* -------------------------------------------------------------------------- */
/* Shutdown Handling (Production hygiene)                                     */
/* -------------------------------------------------------------------------- */

let poolEnded = false;
async function safeEndPool() {
  if (!poolEnded) {
    poolEnded = true;
    await pool.end();
  }
}

process.on("SIGTERM", safeEndPool);
process.on("SIGINT", safeEndPool);

module.exports = {
  pool,
  query,
  getClient,
};
