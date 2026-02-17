"use strict";

const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/requireAuth.js");
const readingController = require("../controllers/readings.controller.js");

/**
 * GET /api/readings/since
 * Return readings for a hive since an ISO timestamp (optional until/limit/order).
 */
router.get("/since", requireAuth, readingController.since);

/**
 * GET /api/readings/latest
 * Return the most recent reading for a hive.
 */
router.get("/latest", requireAuth, readingController.latest);

module.exports = router;
