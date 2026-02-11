"use strict";

/**
 * Ingest Routes
 *
 * Responsibilities:
 * - Accept device telemetry
 * - Apply device authentication middleware
 * - Delegate to ingest controller
 *
 * No session-based auth.
 */

const express = require("express");
const ingestController = require("../controllers/ingest.controller.js");
// const requireDeviceAuth = require("../middleware/requireDeviceAuth.js");

const router = express.Router();

/**
 * POST /api/ingest/readings
 *
 * Accepts telemetry payload from device.
 */
router.post("/readings", ingestController.create);

module.exports = router;
