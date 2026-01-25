/**
 * Auth Routes
 *
 * Purpose:
 * - Define all authentication-related HTTP endpoints
 * - Map URLs to controller methods
 *
 */

const express = require("express");
const router = express.Router();

const authController = require("../auth/auth.controller");
const { requireAuth } = require("../auth/auth.middleware");

/**
 * POST /api/auth/register
 *
 * Creates a new beekeeper account.
 */
router.post("/register", authController.register);

/**
 * POST /api/auth/login
 *
 * Authenticates a user and creates a session.
 */
router.post("/login", authController.login);

/**
 * POST /api/auth/logout
 *
 * Invalidates the current session.
 * Authentication required.
 */
router.post("/logout", requireAuth, authController.logout);

/**
 * GET /api/auth/me
 *
 * Returns the currently authenticated user.
 * Authentication required.
 */
router.get("/me", requireAuth, authController.me);

/**
 * POST /api/auth/refresh
 *
 * Refreshes or extends the current session.
 * Authentication required.
 */
router.post("/refresh", requireAuth, authController.refresh);

/**
 * POST /api/auth/change-password
 *
 * Changes the current user's password.
 * Authentication required.
 *
 * Expected body:
 * {
 *   currentPassword: string,
 *   newPassword: string
 * }
 */
router.post("/change-password", requireAuth, authController.changePassword);

/**
 * POST /api/auth/forgot-password
 *
 * Initiates password reset flow.
 *
 * NOTE:
 * - Stub endpoint (email flow not implemented yet)
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 *
 * Completes password reset flow.
 *
 * NOTE:
 * - Stub endpoint (token verification not implemented yet)
 */
router.post("/reset-password", authController.resetPassword);

module.exports = router;
