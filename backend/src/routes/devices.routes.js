"use strict";

const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/requireAuth.js");
const devicesController = require("../controllers/devices.controller.js");

/**
 * GET /api/devices
 * List all devices for the authenticated beekeeper.
 */
router.get("/", requireAuth, devicesController.list);

/**
 * GET /api/devices/:id
 * Get a single device by id (scoped to authenticated beekeeper).
 */
router.get("/:id", requireAuth, devicesController.getById);

/**
 * POST /api/devices/:id/last-seen
 * Update last-seen timestamp for a device (scoped).
 */
router.post("/:id/last-seen", requireAuth, devicesController.touchLastSeen);

/**
 * DELETE /api/devices/:id
 * Delete a device (scoped).
 */
router.delete("/:id", requireAuth, devicesController.remove);

module.exports = router;
