"use strict";

/**
 * Session Controller
 *
 * Responsibilities:
 * - HTTP concerns only (Express req/res semantics)
 * - Expose current session context (minimal)
 * - Invalidate one or more sessions via SessionService
 *
 * Notes:
 * - Authentication context is provided by requireAuth middleware
 * - Session identity is derived from the session cookie
 * - Cookie management happens exclusively at the HTTP layer
 */

const sessionService = require("../services/sessions.service.js");

/* -------------------------------------------------------------------------- */
/* Cookie helpers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Cookie options used when CLEARING the session cookie.
 * Must match the cookie path used when setting the cookie.
 */
function getSessionClearOptions() {
  return {
    path: "/",
  };
}

/* -------------------------------------------------------------------------- */
/* Current                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/sessions/current
 *
 * Returns minimal authenticated session context.
 */
exports.current = async (req, res) => {
  return res.status(200).json({
    user: req.user,
    session: {
      expiresAt: new Date(req.session.expiresAt).toISOString(),
    },
  });
};

/* -------------------------------------------------------------------------- */
/* Destroy Current                                                             */
/* -------------------------------------------------------------------------- */

/**
 * DELETE /api/sessions/current
 *
 * Invalidates the current session only.
 * Equivalent to logging out from this device.
 */
exports.destroyCurrent = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.sessionId;

    if (sessionToken) {
      await sessionService.invalidateSession({ sessionToken });
    }

    res.clearCookie("sessionId", getSessionClearOptions());

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* Destroy All                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * DELETE /api/sessions
 *
 * Invalidates all sessions for the authenticated user.
 * Useful for "log out of all devices".
 */
exports.destroyAll = async (req, res, next) => {
  try {
    await sessionService.invalidateAllSessionsForUser({
      beekeeperId: Number(req.user.id),
    });

    res.clearCookie("sessionId", getSessionClearOptions());

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};
