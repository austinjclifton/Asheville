"use strict";

/**
 * Device Routes
 *
 * Wiring only.
 * All routes require authentication.
 *
 * Notes:
 * - Creating/listing devices is primarily done via /api/hives/:hiveId/devices
 * - This router provides "global" access patterns (across all hives)
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const devicesController = require("../controllers/devices.controller.js");

const router = express.Router();

router.get("/", requireAuth, devicesController.list);       // all devices for beekeeper
router.get("/:id", requireAuth, devicesController.getById); // single device (scoped)
router.patch("/:id", requireAuth, devicesController.update);
router.delete("/:id", requireAuth, devicesController.remove);

module.exports = router;
