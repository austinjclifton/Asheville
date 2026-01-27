const express = require("express");
const authService = require("../services/auth.service.js");
const { requireAuth } = require("../middleware/requireAuth.js");

const router = express.Router();

/**
 * POST /auth/login
 *
 * Body:
 * {
 *   email: string,
 *   password: string
 * }
 *
 * Behavior:
 * - Validates credentials, creates session, sets session cookie
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    const result = await authService.login(email, password, context);

    if (!result) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const { sessionId, user } = result;

    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      user,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/logout
 *
 * Behavior:
 * - Invalidates current session only, clears session cookie
 */
router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await authService.logout(req.session.id);

    res.clearCookie("sessionId");

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /auth/me
 *
 * Behavior:
 * - Returns authenticated user context
 *
 * * * Used by frontend to bootstrap app state
 */
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    res.status(200).json({
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
