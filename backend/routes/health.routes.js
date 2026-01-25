/**
 * Health Routes
 *
 * Purpose:
 * - Provide a simple liveness / connectivity check
 */

const express = require("express");
const router = express.Router();

/**
 * GET /api/health
 *
 * Returns basic service status.
 * No authentication required.
 */
router.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Asheville Bee Dashboard API",
    status: "healthy",
    time: new Date().toUTCString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

module.exports = router;
