/**
 * Auth Middleware
 *
 * Responsibilities:
 * - Protect routes that require authentication
 * - Validate the presence of an active session
 * - Load the authenticated user into the request context
 *
 */

const authService = require("./auth.service");

/**
 * requireAuth
 *
 * Route guard for endpoints that require a logged-in user.
 *
 * Expected behavior (when implemented):
 * - Extract session token from request (cookie or header)
 * - Validate session
 * - Load user context
 * - Attach user to req.user
 * - Call next() on success
 *
 * Failure cases:
 * - Missing credentials → 401 Unauthorized
 * - Invalid or expired session → 401 Unauthorized
 */
exports.requireAuth = async (req, res, next) => {
  // TODO:
  // - Extract session token (e.g. from cookie or Authorization header)
  // - Validate session via authService
  // - Attach user and session info to req
  //
  // Example:
  // req.user = { id, username, email }
  // req.session = { id, expiresAt }

  return res.status(501).json({
    error: "Not Implemented",
    message: "Authentication middleware is not implemented yet.",
  });
};

/**
 * requireGuest
 *
 * Route guard for endpoints that should only be accessible
 * to unauthenticated users (e.g. login, register).
 *
 * Expected behavior (when implemented):
 * - If user is already authenticated, block the request
 * - Otherwise, allow request to continue
 */
exports.requireGuest = async (req, res, next) => {
  // TODO:
  // - Check if a valid session exists
  // - If authenticated, return 403 Forbidden
  // - Otherwise, call next()

  return res.status(501).json({
    error: "Not Implemented",
    message: "Guest-only middleware is not implemented yet.",
  });
};
