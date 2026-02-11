"use strict";

/**
 * Device Routes
 *
 * Wiring only.
 * All routes require authentication.
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const deviceController = require("../controllers/devices.controller.js");

const router = express.Router();

router.post("/", requireAuth, deviceController.create);
router.get("/", requireAuth, deviceController.list);
router.get("/:id", requireAuth, deviceController.getById);
router.patch("/:id", requireAuth, deviceController.update);
router.delete("/:id", requireAuth, deviceController.remove);

module.exports = router;
