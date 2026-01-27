/**
 * - Database Connection pool:
 * - Maintains a fixed set of open MySQL connections
 * - Reuses connections across queries instead of opening a new one each time
 * - Enforces a maximum number of concurrent DB connections
 * - Queues queries when all connections are busy
 *
 * - This reduces connection overhead and prevents exhausting the DB.
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
 * Thin wrapper around pool.query so repositories do not touch the pool directly.
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * getConnection
 *
 * Used for explicit transactions.
 */
async function getConnection() {
  return pool.getConnection();
}

module.exports = {
  pool,
  query,
  getConnection,
};
