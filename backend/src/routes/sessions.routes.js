"use strict";

const express = require("express");
const router = express.Router();

const sessionController = require("../controllers/session.controller.js");
const { requireAuth } = require("../middleware/requireAuth.js");

/**
 * GET /api/sessions/current
 * Return the current session context. (Auth)
 */
router.get("/current", requireAuth, sessionController.current);

/**
 * DELETE /api/sessions/current
 * Invalidate only the current session (log out this device). (Auth)
 */
router.delete(
  "/current",
  requireAuth,
  requireCsrf,
  sessionController.destroyCurrent,
);

/**
 * DELETE /api/sessions
 * Invalidate all sessions for the authenticated user. (Auth)
 */
router.delete("/", requireAuth, requireCsrf, sessionController.destroyAll);

module.exports = router;
