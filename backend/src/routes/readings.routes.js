"use strict";

/**
 * Reading Routes
 *
 * Responsibilities:
 * - Define authenticated, read-only reading retrieval endpoints
 * - Apply requireAuth middleware
 * - Delegate all request handling to controller
 *
 * Design Principles:
 * - Read-only (telemetry is immutable)
 * - Hive-scoped queries (frontend knows hiveId, not deviceId)
 * - Timestamp-based querying only (since required; until optional)
 * - No mutation routes
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const readingController = require("../controllers/readings.controller.js");

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* GET /api/readings/since                                                    */
/* -------------------------------------------------------------------------- */
/**
 * Returns readings for a hive since a given timestamp (safe flexible range).
 *
 * Required query params:
 * - hiveId: positive integer
 * - since: ISO date/time string
 *
 * Optional query params:
 * - until: ISO date/time string (exclusive upper bound)
 * - limit: positive integer (service caps max)
 * - order: asc | desc
 *
 * Scoped to authenticated beekeeper.
 */
router.get("/since", requireAuth, readingController.since);

/* -------------------------------------------------------------------------- */
/* GET /api/readings/latest                                                   */
/* -------------------------------------------------------------------------- */
/**
 * Returns the most recent reading for a hive.
 *
 * Required query params:
 * - hiveId: positive integer
 *
 * Scoped to authenticated beekeeper.
 */
router.get("/latest", requireAuth, readingController.latest);

module.exports = router;
