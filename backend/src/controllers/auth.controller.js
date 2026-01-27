"use strict";

/**
 * Auth Controller
 *
 * Responsibilities:
 * - HTTP concerns only (Express req/res semantics)
 * - Validate incoming request shapes (presence, basic formatting)
 * - Call the service layer
 * - Translate service results/errors into HTTP responses
 * - Set/clear cookies
 */

const authService = require("../services/auth.service.js");

/**
 * Cookie settings are centralized here so the "cookie policy"
 * is consistent across all auth endpoints.
 */
function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  };
}

/**
 * Basic helper to avoid repeated "req.body ?? {}" patterns.
 */
function safeBody(req) {
  return req.body ?? {};
}

/**
 * POST /api/auth/register
 *
 * Creates a new user and an initial session.
 *
 * Body:
 * {
 *   username: string,
 *   email: string,
 *   password: string
 * }
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = safeBody(req);

    // Minimal HTTP-level validation (service does deeper rules later)
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email, and password are required",
      });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    const result = await authService.register({
      username,
      email,
      password,
      context,
    });

    // Service guarantees consistent result shape:
    // { user, session: { id, token, expiresAt } }
    res.cookie("sessionId", result.session.token, getSessionCookieOptions());

    return res.status(201).json({
      user: result.user,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/login
 *
 * Authenticates a user and creates a new session.
 *
 * Body:
 * {
 *   identifier: string,   // email or username
 *   password: string
 * }
 */
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = safeBody(req);

    if (!identifier || !password) {
      return res.status(400).json({
        error: "identifier and password are required",
      });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    const result = await authService.login({
      identifier,
      password,
      context,
    });

    res.cookie("sessionId", result.session.token, getSessionCookieOptions());

    return res.status(200).json({
      user: result.user,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/logout
 *
 * Invalidates the current session only and clears the cookie.
 *
 * requireAuth middleware guarantees:
 * - req.user exists
 * - req.session exists (with id)
 */
exports.logout = async (req, res, next) => {
  try {
    await authService.logout({
      sessionToken: req.cookies.sessionId,
    });

    // Clearing cookie is an HTTP concern, so it belongs here.
    res.clearCookie("sessionId", getSessionCookieOptions());

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/change-password
 *
 * Changes the authenticated user's password.
 *
 * Body:
 * {
 *   currentPassword: string,
 *   newPassword: string
 * }
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = safeBody(req);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "currentPassword and newPassword are required",
      });
    }

    await authService.changePassword({
      userId: req.user.id,
      currentPassword,
      newPassword,
    });

    // 204: success, no content
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/auth/me
 *
 * Returns the authenticated user context.
 *
 * requireAuth middleware populates req.user.
 */
exports.me = async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
};
