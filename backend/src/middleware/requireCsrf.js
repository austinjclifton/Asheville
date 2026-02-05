"use strict";

/**
 * requireCsrf middleware
 *
 * Ensures state-changing requests include a valid CSRF token.
 *
 * Assumes:
 * - requireAuth has already populated req.session
 */

exports.requireCsrf = (req, res, next) => {
  if (!req.session) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = req.get("x-csrf-token");

  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({
      error: "Invalid CSRF token",
    });
  }

  next();
};
