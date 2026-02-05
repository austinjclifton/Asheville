"use strict";

/**
 * Auth Controller
 *
 * Responsibilities:
 * - HTTP concerns only (Express req/res semantics)
 * - Validate incoming request shapes
 * - Call service layer
 * - Translate service results/errors into HTTP responses
 * - Set / clear cookies
 *
 * CSRF model (Option A):
 * - CSRF token is REQUIRED for logout and all state-changing requests
 * - CSRF token is returned at login and via /csrf
 * - Session token is HttpOnly cookie only
 */

const authService = require("../services/auth.service.js");
const sessionService = require("../services/sessions.service.js");

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // must match session service

/* -------------------------------------------------------------------------- */
/* Cookie helpers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Cookie options used when SETTING the session cookie.
 */
function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS,
  };
}

/**
 * Cookie options used when CLEARING the session cookie.
 * Must match name + path only.
 */
function getSessionClearOptions() {
  return {
    path: "/",
  };
}

/**
 * Basic helper to avoid repeated "req.body ?? {}".
 */
function safeBody(req) {
  return req.body ?? {};
}

/* -------------------------------------------------------------------------- */
/* Register                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/auth/register
 *
 * Creates a new user and initial session.
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = safeBody(req);

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "username, email, and password are required",
      });
    }

    const result = await authService.register({
      username,
      email,
      password,
    });

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

/* -------------------------------------------------------------------------- */
/* Login                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/auth/login
 *
 * Authenticates a user and creates a new session.
 */
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = safeBody(req);

    if (!identifier || !password) {
      return res.status(400).json({
        error: "identifier and password are required",
      });
    }

    const result = await authService.login({
      identifier,
      password,
    });

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

/* -------------------------------------------------------------------------- */
/* Logout                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/auth/logout
 *
 * Invalidates the current session.
 * CSRF token REQUIRED (Option A).
 */
exports.logout = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.sessionId;

    await sessionService.invalidateSession({ sessionToken });

    res.clearCookie("sessionId", getSessionClearOptions());

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* Change Password                                                             */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/auth/change-password
 *
 * Changes the authenticated user's password.
 * CSRF token REQUIRED.
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

    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* CSRF                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/auth/csrf
 *
 * Returns the CSRF token for the current session.
 * Authentication required.
 */
exports.csrf = async (req, res) => {
  return res.status(200).json({
    csrfToken: req.session.csrfToken,
  });
};

/* -------------------------------------------------------------------------- */
/* Me                                                                          */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/auth/me
 *
 * Returns the authenticated user context.
 */
exports.me = async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
};
