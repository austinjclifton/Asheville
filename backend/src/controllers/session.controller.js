"use strict";

/**
 * Session Controller
 *
 * Responsibilities:
 * - HTTP concerns only (Express req/res semantics)
 * - Expose current session context
 * - Invalidate the current session
 *
 * Notes:
 * - Sessions are owned by SessionService
 * - Authentication context is provided by requireAuth middleware
 */

const sessionService = require("../services/sessions.service.js");

/**
 * GET /api/sessions/current
 *
 * Returns the current authenticated session context.
 * Useful for debugging and diagnostics.
 */
exports.current = async (req, res) => {
  return res.status(200).json({
    session: {
      id: req.session.id,
      expiresAt: req.session.expiresAt,
    },
    user: req.user,
  });
};

/**
 * DELETE /api/sessions/current
 *
 * Invalidates the current session and clears the cookie.
 */
exports.destroy = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.sessionId;

    if (sessionToken) {
      await sessionService.invalidateSession({
        sessionToken,
      });
    }

    res.clearCookie("sessionId");

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    return next(err);
  }
};
