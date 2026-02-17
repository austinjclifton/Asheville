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
 * This file intentionally contains:
 * - No business logic
 * - No domain SQL
 */

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Production-safe defaults (tune per deployment)
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

/**
 * Run a query and return rows (repositories should use this).
 */
async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result.rows;
}

/**
 * Acquire a dedicated client for explicit transactions.
 */
async function getClient() {
  return pool.connect();
}

/**
 * End the pool once (used for process shutdown hygiene).
 */
let poolEnded = false;
async function safeEndPool() {
  if (poolEnded) return;
  poolEnded = true;
  await pool.end();
}

process.on("SIGTERM", safeEndPool);
process.on("SIGINT", safeEndPool);

module.exports = { pool, query, getClient };
