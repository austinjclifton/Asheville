"use strict";

/**
 * requireAuth
 *
 * Purpose:
 * - Enforce session-based authentication for /api/* routes.
 *
 * What it guarantees (on success):
 * - req.user: authenticated user context (as returned by SessionService)
 * - req.session: active session record for this request
 *
 * How it works:
 * - Reads the session token from the HttpOnly `sessionId` cookie
 * - Validates the session via SessionService (expiry/active/user lookup)
 * - Attaches the resolved context to req for downstream handlers
 *
 * Failure behavior:
 * - 401 if the cookie is missing
 * - 401 if the session is invalid/expired
 */

const sessionService = require("../services/sessions.service.js");

exports.requireAuth = async (req, res, next) => {
  try {
    // Session identity is carried by the sessionId cookie.
    const sessionToken = req.cookies?.sessionId;
    if (!sessionToken) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Delegate all session validation rules to the service layer.
    const context = await sessionService.validateSession({ sessionToken });
    if (!context) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    // Downstream handlers can trust these are present.
    req.user = context.user;
    req.session = context.session;

    return next();
  } catch (err) {
    return next(err);
  }
};
