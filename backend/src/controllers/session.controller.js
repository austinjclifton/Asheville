"use strict";

/**
 * Session Controller
 *
 * Responsibilities:
 * - HTTP request/response concerns only
 * - Return current session context
 * - Delegate invalidation to SessionsService
 *
 * Assumptions:
 * - requireAuth populates req.user and req.session
 */

const sessionService = require("../services/sessions.service.js");
const { clearSessionCookie } = require("../utils/sessionCookie.js");

/**
 * GET /api/sessions/current
 * Return minimal authenticated session context.
 */
exports.current = async (req, res, next) => {
  try {
    return res.status(200).json({
      user: req.user,
      session: {
        expiresAt: new Date(req.session.expiresAt).toISOString(),
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/sessions/current
 * Invalidate only the current session (log out this device).
 */
exports.destroyCurrent = async (req, res, next) => {
  try {
    const sessionToken = req.session?.sessionToken;

    if (typeof sessionToken === "string" && sessionToken.length) {
      await sessionService.invalidateSession({ sessionToken });
    }

    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/sessions
 * Invalidate all sessions for the authenticated user (log out everywhere).
 */
exports.destroyAll = async (req, res, next) => {
  try {
    await sessionService.invalidateAllSessionsForUser({
      beekeeperId: Number(req.user.id),
    });

    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};
