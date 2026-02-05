// --- MVP: Password recovery is NOT supported. Stubs only. ---
// router.post("/forgot-password", (req, res) => {
//   // Not implemented in MVP
//   res.status(501).json({ error: "Password recovery is not supported in MVP." });
// });
// router.post("/reset-password", (req, res) => {
//   // Not implemented in MVP
//   res.status(501).json({ error: "Password recovery is not supported in MVP." });
// });
"use strict";

/**
 * Auth Routes
 *
 * Responsibilities:
 * - Define all authentication-related HTTP endpoints
 * - Apply auth + CSRF middleware where required
 */

const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller.js");
const { requireAuth } = require("../middleware/requireAuth.js");
const { requireCsrf } = require("../middleware/requireCsrf.js");

/**
 * POST /api/auth/register
 */
router.post("/register", authController.register);

/**
 * POST /api/auth/login
 */
router.post("/login", authController.login);

/**
 * POST /api/auth/logout
 *
 * Requires:
 * - authenticated session cookie
 * - valid CSRF token header
 */
router.post("/logout", requireAuth, requireCsrf, authController.logout);

/**
 * POST /api/auth/change-password
 *
 * Requires:
 * - authenticated session cookie
 * - valid CSRF token header
 */
router.post(
  "/change-password",
  requireAuth,
  requireCsrf,
  authController.changePassword,
);

/**
 * GET /api/auth/csrf
 *
 * Returns CSRF token for the current session.
 */
router.get("/csrf", requireAuth, authController.csrf);

/**
 * GET /api/auth/me
 */
router.get("/me", requireAuth, authController.me);

module.exports = router;
