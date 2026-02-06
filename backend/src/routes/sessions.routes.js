"use strict";

/**
 * Session Routes
 *
 * Responsibilities:
 * - Define session-related HTTP endpoints
 * - Apply authentication middleware
 * - Delegate request handling to controllers
 *
 * Session identity is derived exclusively from the session cookie.
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const sessionController = require("../controllers/session.controller.js");

const router = express.Router();

/* -------------------------------------------------------------------------- */
/* Current Session                                                             */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/sessions/current
 *
 * Returns the currently authenticated session context.
 */
router.get("/current", requireAuth, sessionController.current);

/**
 * DELETE /api/sessions/current
 *
 * Invalidates the current session only (log out this device).
 */
router.delete("/current", requireAuth, sessionController.destroyCurrent);

/* -------------------------------------------------------------------------- */
/* All Sessions                                                                */
/* -------------------------------------------------------------------------- */

/**
 * DELETE /api/sessions
 *
 * Invalidates all sessions for the authenticated user
 * ("log out of all devices").
 */
router.delete("/", requireAuth, sessionController.destroyAll);

module.exports = router;
