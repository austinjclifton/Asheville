"use strict";

const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/requireAuth.js");
const hivesController = require("../controllers/hives.controller.js");
const devicesController = require("../controllers/devices.controller.js");

/**
 * POST /api/hives
 * Create a hive for the authenticated beekeeper.
 */
router.post("/", requireAuth, hivesController.create);

/**
 * GET /api/hives
 * List hives for the authenticated beekeeper.
 */
router.get("/", requireAuth, hivesController.list);

/**
 * GET /api/hives/:id
 * Get a single hive by id (scoped).
 */
router.get("/:id", requireAuth, hivesController.getById);

/**
 * PATCH /api/hives/:id
 * Patch/update hive fields (scoped).
 */
router.patch("/:id", requireAuth, hivesController.update);

/**
 * DELETE /api/hives/:id
 * Delete a hive (scoped).
 */
router.delete("/:id", requireAuth, hivesController.remove);

/**
 * POST /api/hives/:hiveId/devices
 * Create a device under a hive (scoped).
 */
router.post("/:hiveId/devices", requireAuth, devicesController.createForHive);

/**
 * GET /api/hives/:hiveId/devices
 * List devices under a hive (scoped).
 */
router.get("/:hiveId/devices", requireAuth, devicesController.listForHive);

module.exports = router;
