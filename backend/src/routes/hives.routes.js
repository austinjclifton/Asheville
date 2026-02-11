"use strict";

/**
 * Hive Routes
 *
 * This module is wiring only:
 * - declares HTTP routes
 * - applies middleware
 * - delegates to controllers
 *
 * It must NOT contain business logic or SQL.
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const hivesController = require("../controllers/hives.controller.js");

const router = express.Router();

/**
 * POST /api/hives
 * Create a hive owned by the authenticated beekeeper.
 */
router.post("/", requireAuth, hivesController.create);

/**
 * GET /api/hives
 * List all hives owned by the authenticated beekeeper.
 */
router.get("/", requireAuth, hivesController.list);

/**
 * GET /api/hives/:id
 * Fetch a single hive by id (must be owned by the authenticated beekeeper).
 */
router.get("/:id", requireAuth, hivesController.getById);

/**
 * PATCH /api/hives/:id
 * Partially update a hive (owned by authenticated beekeeper).
 */
router.patch("/:id", requireAuth, hivesController.update);

/**
 * DELETE /api/hives/:id
 * Delete a hive (owned by authenticated beekeeper).
 * Cascades to devices/readings via FK constraints.
 */
router.delete("/:id", requireAuth, hivesController.remove);

module.exports = router;
