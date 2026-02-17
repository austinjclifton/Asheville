"use strict";

/**
 * requireCsrf
 *
 * Purpose:
 * - Protect authenticated, state-changing routes against CSRF.
 *
 * Assumptions:
 * - requireAuth already ran and populated req.session
 *
 * How it works:
 * - Reads token from the `x-csrf-token` request header
 * - Compares it to the per-session CSRF token stored on req.session
 *
 * Failure behavior:
 * - 401 if authentication context is missing
 * - 403 if the CSRF token is missing or does not match
 */

exports.requireCsrf = (req, res, next) => {
  // CSRF checks only make sense for an authenticated session.
  if (!req.session) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Client must send the CSRF token in a header on state-changing requests.
  const token = req.get("x-csrf-token");
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }

  return next();
};
