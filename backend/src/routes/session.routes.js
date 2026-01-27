const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const sessionService = require("../services/session.service.js");

const router = express.Router();

/**
 * GET /sessions/current
 *
 * Behavior:
 * - Returns the currently authenticated session context
 *
 * * * Useful for debugging
 */
router.get("/current", requireAuth, async (req, res, next) => {
  try {
    res.status(200).json({
      session: {
        id: req.session.id,
        expiresAt: req.session.expiresAt,
      },
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /sessions/current
 *
 * Behavior:
 * - Invalidates the current session, clears session cookie
 *
 */
router.delete("/current", requireAuth, async (req, res, next) => {
  try {
    await sessionService.invalidateSession(req.session.id);

    res.clearCookie("sessionId");

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
