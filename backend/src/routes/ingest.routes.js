"use strict";

const express = require("express");
const ingestController = require("../controllers/ingest.controller.js");
const { requireIngestToken } = require("../middleware/requireIngestToken.js");

const router = express.Router();

/**
 * POST /ingest/readings
 * Accepts telemetry payload from a device
 */
router.post("/readings", requireIngestToken, ingestController.create);

module.exports = router;