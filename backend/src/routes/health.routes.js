"use strict";

const express = require("express");
const router = express.Router();
const { query } = require("../db/pool"); // adjust path if needed

/* -------------------------------------------------------------------------- */
/* GET /health                                                                 */
/* Liveness: process is running                                                */
/* -------------------------------------------------------------------------- */

router.get("/", (req, res) => {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime_s: Math.floor(process.uptime()),
  });
});

/* -------------------------------------------------------------------------- */
/* GET /health/ready                                                           */
/* Readiness: DB reachable                                                     */
/* -------------------------------------------------------------------------- */

router.get("/ready", async (req, res, next) => {
  try {
    // Minimal, fast DB check
    await query("SELECT 1");
    return res.status(200).json({
      status: "ok",
      db: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Don't leak internals; just indicate not ready
    return res.status(503).json({
      status: "degraded",
      db: "down",
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
