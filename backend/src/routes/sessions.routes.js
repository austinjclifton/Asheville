"use strict";

/**
 * Session Routes
 *
 * Responsibilities:
 * - Define session-related HTTP endpoints
 * - Apply authentication middleware
 * - Delegate request handling to controllers
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const sessionController = require("../controllers/session.controller.js");

const router = express.Router();

/**
 * GET /api/sessions/current
 *
 * Returns the current authenticated session context.
 */
router.get("/current", requireAuth, sessionController.current);

module.exports = router;
