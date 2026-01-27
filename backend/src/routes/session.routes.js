"use strict";

/**
 * Session Routes
 *
 * Responsibilities:
 * - Define HTTP routes and apply middleware (wiring only)
 * - Delegate request handling to controllers
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const sessionController = require("../controllers/session.controller.js");

const router = express.Router();

/**
 * Current session
 * GET /api/sessions/current
 */
router.get("/current", requireAuth, sessionController.current);

/**
 * Invalidate current session
 * DELETE /api/sessions/current
 */
router.delete("/current", requireAuth, sessionController.destroy);

module.exports = router;
