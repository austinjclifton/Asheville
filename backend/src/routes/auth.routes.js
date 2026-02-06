/**
 * Auth Routes
 *
 * Responsibilities:
 * - Define authentication-related HTTP endpoints
 * - Apply authentication and CSRF middleware where required
 * - Delegate all request handling to controllers
 *
 * Route categories:
 * - Public (unauthenticated): register, login, reset-password
 * - Authenticated: logout, change-password, me, csrf
 */

const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller.js");
const { requireAuth } = require("../middleware/requireAuth.js");
const { requireCsrf } = require("../middleware/requireCsrf.js");

/* -------------------------------------------------------------------------- */
/* Public (Unauthenticated) Routes                                             */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/auth/register
 *
 * Creates a new user and initial session.
 */
router.post("/register", authController.register);

/**
 * POST /api/auth/login
 *
 * Authenticates a user and creates a new session.
 */
router.post("/login", authController.login);

/**
 * POST /api/auth/reset-password/request
 *
 * Initiates a password reset flow.
 * Always returns success to prevent account enumeration.
 */
router.post("/reset-password/request", authController.requestPasswordReset);

/**
 * POST /api/auth/reset-password/confirm
 *
 * Completes a password reset using a one-time reset token.
 */
router.post("/reset-password/confirm", authController.confirmPasswordReset);

/* -------------------------------------------------------------------------- */
/* Authenticated Routes                                                        */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/auth/logout
 *
 * Invalidates the current session.
 *
 * Requires:
 * - authenticated session cookie
 * - valid CSRF token
 */
router.post("/logout", requireAuth, requireCsrf, authController.logout);

/**
 * POST /api/auth/change-password
 *
 * Changes the authenticated user's password.
 *
 * Requires:
 * - authenticated session cookie
 * - valid CSRF token
 */
router.post(
  "/change-password",
  requireAuth,
  requireCsrf,
  authController.changePassword,
);

/**
 * GET /api/auth/me
 *
 * Returns the authenticated user's public profile.
 */
router.get("/me", requireAuth, authController.me);

/**
 * DELETE /api/auth/me
 *
 * Deletes the authenticated user's account and all sessions.
 *
 * Requires:
 * - authenticated session cookie
 * - valid CSRF token
 */
router.delete(
  "/me",
  requireAuth,
  requireCsrf,
  authController.deleteUser,
);

/**
 * GET /api/auth/csrf
 *
 * Returns the CSRF token for the current session.
 * Authentication required.
 */
router.get("/csrf", requireAuth, authController.csrf);

module.exports = router;
