"use strict";

/**
 * Reading Routes
 *
 * Responsibilities:
 * - Define authenticated reading retrieval endpoints
 * - Apply requireAuth middleware
 * - Delegate all logic to controller
 *
 * Design Principles:
 * - Read-only (telemetry is immutable)
 * - Filter-based querying
 * - No mutation routes
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const readingController = require("../controllers/readings.controller.js");

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* Authenticated Reading Retrieval                                             */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/readings
 *
 * Flexible reading query endpoint.
 *
 * Query params:
 * - deviceId (optional)
 * - hiveId (optional)
 * - from (ISO timestamp, optional)
 * - to (ISO timestamp, optional)
 * - limit (optional, default enforced in service)
 *
 * Returns readings scoped to authenticated beekeeper.
 */
router.get("/", requireAuth, readingController.list);

/**
 * GET /api/readings/latest
 *
 * Returns latest reading per device
 * scoped to authenticated beekeeper.
 */
router.get("/latest", requireAuth, readingController.latest);

/**
 * GET /api/readings/stats
 *
 * Returns aggregate statistics:
 * - min
 * - max
 * - avg
 * - count
 *
 * Filterable by deviceId, hiveId, from, to.
 */
router.get("/stats", requireAuth, readingController.stats);

module.exports = router;
