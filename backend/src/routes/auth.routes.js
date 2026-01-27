"use strict";

/**
 * Auth Routes
 *
 * Responsibilities:
 * - Define HTTP routes and apply middleware (wiring only)
 * - Delegate request handling to controllers
 */

const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const authController = require("../controllers/auth.controller.js");

const router = express.Router();

/**
 * Register
 * POST /api/auth/register
 */
router.post("/register", authController.register);

/**
 * Login
 * POST /api/auth/login
 */
router.post("/login", authController.login);

/**
 * Logout (requires an active session)
 * POST /api/auth/logout
 */
router.post("/logout", requireAuth, authController.logout);

/**
 * Change password (requires an active session)
 * POST /api/auth/change-password
 */
router.post("/change-password", requireAuth, authController.changePassword);

/**
 * Current user (bootstrap endpoint)
 * GET /api/auth/me
 */
router.get("/me", requireAuth, authController.me);

module.exports = router;
