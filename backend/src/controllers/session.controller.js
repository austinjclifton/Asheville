"use strict";

/**
 * Session Controller
 *
 * Responsibilities:
 * - Handle HTTP request/response concerns only
 * - Return current session context
 * - Delegate session invalidation to SessionService
 *
 * Assumptions:
 * - requireAuth populates req.user and req.session
 * - session identity is carried by the sessionId cookie
 */

const sessionService = require("../services/sessions.service.js");

/**
 * Cookie options used when clearing the session cookie.
 * Keep aligned with options used when setting the cookie (at least path).
 */
function getSessionClearOptions() {
  return { path: "/" };
}

/**
 * GET /api/sessions/current
 * Return minimal authenticated session context.
 */
exports.current = async (req, res) => {
  // requireAuth guarantees req.user and req.session exist.
  return res.status(200).json({
    user: req.user,
    session: {
      expiresAt: new Date(req.session.expiresAt).toISOString(),
    },
  });
};

/**
 * DELETE /api/sessions/current
 * Invalidate only the current session (log out this device).
 */
exports.destroyCurrent = async (req, res, next) => {
  try {
    // If a cookie exists, invalidate that token in storage.
    const sessionToken = req.cookies?.sessionId;
    if (sessionToken) {
      await sessionService.invalidateSession({ sessionToken });
    }

    // Always clear the browser cookie at the HTTP layer.
    res.clearCookie("sessionId", getSessionClearOptions());

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
    // Service enforces user scoping and invalidation policy.
    await sessionService.invalidateAllSessionsForUser({
      beekeeperId: Number(req.user.id),
    });

    // Clear the current browser cookie as well.
    res.clearCookie("sessionId", getSessionClearOptions());

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};
