"use strict";

/**
 * Device Routes
 *
 * Responsibilities:
 * - Define HTTP routes and apply middleware (wiring only)
 * - Delegate request handling to controllers
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const deviceController = require("../controllers/device.controller.js");

const router = express.Router();

/**
 * List devices
 * GET /api/devices
 */
router.get("/", requireAuth, deviceController.list);

/**
 * Create device
 * POST /api/devices
 */
router.post("/", requireAuth, deviceController.create);

/**
 * Get device
 * GET /api/devices/:deviceId
 */
router.get("/:deviceId", requireAuth, deviceController.get);

/**
 * Update device
 * PUT /api/devices/:deviceId
 */
router.put("/:deviceId", requireAuth, deviceController.update);

/**
 * Delete device
 * DELETE /api/devices/:deviceId
 */
router.delete("/:deviceId", requireAuth, deviceController.remove);

module.exports = router;
