"use strict";

/**
 * Reading Routes
 *
 * Responsibilities:
 * - Define HTTP routes and apply middleware (wiring only)
 * - Delegate request handling to controllers
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const readingController = require("../controllers/readings.controller.js");

const router = express.Router();

/**
 * List readings
 * GET /api/readings
 */
router.get("/", requireAuth, readingController.list);

/**
 * Latest reading
 * GET /api/readings/latest
 */
router.get("/latest", requireAuth, readingController.latest);

/**
 * Device readings
 * GET /api/devices/:deviceId/readings
 */
router.get(
  "/devices/:deviceId/readings",
  requireAuth,
  readingController.listForDevice,
);

/**
 * Hive readings
 * GET /api/hives/:hiveId/readings
 */
router.get(
  "/hives/:hiveId/readings",
  requireAuth,
  readingController.listForHive,
);

module.exports = router;
