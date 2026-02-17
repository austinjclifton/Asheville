"use strict";

const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller.js");
const { requireAuth } = require("../middleware/requireAuth.js");
const { requireCsrf } = require("../middleware/requireCsrf.js");

/**
 * POST /api/auth/register
 * Create a new user and start a session.
 */
router.post("/register", authController.register);

/**
 * POST /api/auth/login
 * Authenticate and start a session.
 */
router.post("/login", authController.login);

/**
 * POST /api/auth/reset-password/request
 * Request a password reset token (always returns success).
 */
router.post("/reset-password/request", authController.requestPasswordReset);

/**
 * POST /api/auth/reset-password/confirm
 * Confirm a password reset using a one-time token.
 */
router.post("/reset-password/confirm", authController.confirmPasswordReset);

/**
 * POST /api/auth/logout
 * Invalidate the current session. (Auth + CSRF)
 */
router.post("/logout", requireAuth, requireCsrf, authController.logout);

/**
 * POST /api/auth/change-password
 * Change the authenticated user's password. (Auth + CSRF)
 */
router.post("/change-password", requireAuth, requireCsrf, authController.changePassword);

/**
 * GET /api/auth/me
 * Return the authenticated user's profile. (Auth)
 */
router.get("/me", requireAuth, authController.me);

/**
 * DELETE /api/auth/me
 * Delete the authenticated user and all sessions. (Auth + CSRF)
 */
router.delete("/me", requireAuth, requireCsrf, authController.deleteUser);

/**
 * GET /api/auth/csrf
 * Return the CSRF token for the current session. (Auth)
 */
router.get("/csrf", requireAuth, authController.csrf);

module.exports = router;
