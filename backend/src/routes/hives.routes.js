"use strict";

/**
 * Hive Routes
 *
 * Wiring only:
 * - declare routes
 * - apply middleware
 * - delegate to controllers
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");

const hivesController = require("../controllers/hives.controller.js");
const devicesController = require("../controllers/devices.controller.js");

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* Hives                                                                       */
/* -------------------------------------------------------------------------- */

router.post("/", requireAuth, hivesController.create);
router.get("/", requireAuth, hivesController.list);
router.get("/:id", requireAuth, hivesController.getById);
router.patch("/:id", requireAuth, hivesController.update);
router.delete("/:id", requireAuth, hivesController.remove);

/* -------------------------------------------------------------------------- */
/* Nested Devices (device belongs to hive)                                     */
/* -------------------------------------------------------------------------- */

router.post("/:hiveId/devices", requireAuth, devicesController.createForHive);
router.get("/:hiveId/devices", requireAuth, devicesController.listForHive);

module.exports = router;
