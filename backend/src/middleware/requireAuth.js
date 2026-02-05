"use strict";

/**
 * requireAuth middleware
 *
 * Guarantees for downstream handlers that:
 * - req.user is defined
 * - req.session is the full active session row
 *
 * Responsibilities:
 * - Extract session token from cookie
 * - Delegate validation to SessionService
 * - Attach resolved context to request
 */

const sessionService = require("../services/sessions.service.js");

exports.requireAuth = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.sessionId;

    if (!sessionToken) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const context = await sessionService.validateSession({
      sessionToken,
    });

    if (!context) {
      return res.status(401).json({
        error: "Invalid or expired session",
      });
    }

    req.user = context.user;
    req.session = context.session;

    return next();
  } catch (err) {
    return next(err);
  }
};
