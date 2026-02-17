"use strict";

const express = require("express");
const router = express.Router();

const ingestController = require("../controllers/ingest.controller.js");

/**
 * POST /api/ingest/readings
 * Accept telemetry payload from a device.
 */
router.post("/readings", ingestController.create);

module.exports = router;
