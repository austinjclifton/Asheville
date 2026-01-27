"use strict";

/**
 * requireAuth middleware
 *
 * Purpose:
 * - Enforce authentication on protected routes
 * - Validate session token
 * - Attach authenticated user and session context to the request
 *
 * Guarantees for downstream handlers:
 * - req.user is defined
 * - req.session = { id, expiresAt }
 *
 * This middleware:
 * - Does NOT know about cookies beyond extracting the token
 * - Does NOT perform DB access
 * - Delegates all validation to the auth service
 */

const authService = require("../services/auth.service.js");

exports.requireAuth = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.sessionId;

    if (!sessionToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    const result = await authService.getSessionContext({
      sessionToken,
      context,
    });

    if (!result || !result.user || !result.session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Hard guarantees for downstream code
    req.user = result.user;
    req.session = {
      id: result.session.id,
      expiresAt: result.session.expiresAt,
    };

    return next();
  } catch (err) {
    return next(err);
  }
};
