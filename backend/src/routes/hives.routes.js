"use strict";

/**
 * Hive Routes
 *
 * Responsibilities:
 * - Define HTTP routes and apply middleware (wiring only)
 * - Delegate request handling to controllers
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const hiveController = require("../controllers/hive.controller.js");

const router = express.Router();

/**
 * List hives
 * GET /api/hives
 */
router.get("/", requireAuth, hiveController.list);

/**
 * Create hive
 * POST /api/hives
 */
router.post("/", requireAuth, hiveController.create);

/**
 * Get hive
 * GET /api/hives/:hiveId
 */
router.get("/:hiveId", requireAuth, hiveController.get);

/**
 * Update hive
 * PUT /api/hives/:hiveId
 */
router.put("/:hiveId", requireAuth, hiveController.update);

/**
 * Delete hive
 * DELETE /api/hives/:hiveId
 */
router.delete("/:hiveId", requireAuth, hiveController.remove);

module.exports = router;
