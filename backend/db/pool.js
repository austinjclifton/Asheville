/**
 * Database Pool
 *
 * Responsibilities:
 * - Create and export a shared MySQL connection pool
 * - Provide a single query interface for the application
 *
 */

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * query
 *
 * Thin wrapper around pool.query so repos have
 * a consistent import surface.
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = {
  pool,
  query,
};
