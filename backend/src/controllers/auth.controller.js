"use strict";

/**
 * Auth Controller
 *
 * Responsibilities:
 * - HTTP concerns only (Express req/res)
 * - Validate request inputs at the boundary
 * - Delegate business logic to services
 * - Translate service outcomes into HTTP responses
 *
 * Security model:
 * - Session token is stored in HttpOnly `sessionId` cookie
 * - CSRF token is required for authenticated state-changing routes
 * - requireAuth populates req.user + req.session for authenticated routes
 */

const authService = require("../services/auth.service.js");
const sessionService = require("../services/sessions.service.js");
const passwordResetService = require("../services/passwordReset.service.js");

/**
 * Cookie options used when setting the session cookie.
 * Keep aligned with deployment expectations (secure in production).
 */
function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  };
}

/**
 * Cookie options used when clearing the session cookie.
 * Must match the cookie path used when setting the cookie.
 */
function getSessionClearOptions() {
  return { path: "/" };
}

/**
 * Defensive helper for request bodies.
 */
function safeBody(req) {
  return req.body ?? {};
}

/**
 * POST /api/auth/register
 * Create a new user and an initial authenticated session.
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = safeBody(req);

    // Basic shape validation at the HTTP boundary.
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email, and password are required",
      });
    }

    const result = await authService.register({
      username,
      email,
      password,
      context: req.context,
    });

    // Persist session via HttpOnly cookie; return CSRF token in JSON.
    res.cookie(
      "sessionId",
      result.session.sessionToken,
      getSessionCookieOptions(),
    );

    return res.status(201).json({
      user: result.user,
      csrfToken: result.session.csrfToken,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/login
 * Authenticate a user and create a new session.
 */
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = safeBody(req);

    // Basic shape validation at the HTTP boundary.
    if (!identifier || !password) {
      return res.status(400).json({
        error: "identifier and password are required",
      });
    }

    const result = await authService.login({
      identifier,
      password,
      context: req.context,
    });

    // Persist session via HttpOnly cookie; return CSRF token in JSON.
    res.cookie(
      "sessionId",
      result.session.sessionToken,
      getSessionCookieOptions(),
    );

    return res.status(200).json({
      user: result.user,
      csrfToken: result.session.csrfToken,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/logout
 * Invalidate the current session (CSRF required).
 */
exports.logout = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.sessionId;

    // If the cookie is missing, treat as already logged out.
    if (!sessionToken) {
      return res.status(200).json({ success: true });
    }

    await sessionService.invalidateSession({ sessionToken });

    // Clear cookie regardless of invalidate outcome (best-effort logout).
    res.clearCookie("sessionId", getSessionClearOptions());

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/change-password
 * Change the authenticated user's password (CSRF required).
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = safeBody(req);

    // Basic shape validation at the HTTP boundary.
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "currentPassword and newPassword are required",
      });
    }

    await authService.changePassword({
      userId: Number(req.user.id),
      currentPassword,
      newPassword,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/reset-password/request
 * Start a password reset flow (always returns success to prevent enumeration).
 */
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = safeBody(req);

    // Require an email shape, but do not reveal whether it exists.
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    await passwordResetService.requestResetForEmail({ email });

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/reset-password/confirm
 * Complete a password reset using a one-time reset token.
 */
exports.confirmPasswordReset = async (req, res, next) => {
  try {
    const { token, newPassword } = safeBody(req);

    // Basic shape validation at the HTTP boundary.
    if (!token || !newPassword) {
      return res.status(400).json({
        error: "token and newPassword are required",
      });
    }

    // Verify token first (do not consume until reset succeeds).
    const verification = await passwordResetService.verifyResetToken({
      rawToken: token,
    });

    if (!verification) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    // Reset password, then consume token only after success.
    await authService.resetPassword({
      userId: Number(verification.userId),
      newPassword,
    });

    await passwordResetService.consumeResetTokenForUser({
      userId: verification.userId,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/auth/csrf
 * Return the CSRF token for the current session.
 */
exports.csrf = async (req, res) => {
  return res.status(200).json({ csrfToken: req.session.csrfToken });
};

/**
 * GET /api/auth/me
 * Return the authenticated user's public profile.
 */
exports.me = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

/**
 * DELETE /api/auth/me
 * Delete the authenticated user and all sessions (CSRF required).
 */
exports.deleteUser = async (req, res, next) => {
  try {
    await authService.deleteUserAndSessions({
      userId: Number(req.user.id),
      requesterId: Number(req.user.id),
    });

    // Clearing cookie ensures the browser is logged out immediately.
    res.clearCookie("sessionId", getSessionClearOptions());

    return res.status(204).send();
  } catch (err) {
    // Translate known service errors into stable HTTP responses.
    if (err.status === 404) {
      return res.status(404).json({ error: "User not found" });
    }
    if (err.status === 403) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next(err);
  }
};
