"use strict";

/**
 * Auth Controller
 *
 * Responsibilities:
 * - HTTP concerns only (Express req/res)
 * - Light boundary validation + normalization
 * - Delegate all business logic to services
 * - Use next(err) consistently for error handling
 *
 * Security model:
 * - Session token is stored in HttpOnly `sessionId` cookie
 * - CSRF token is required for authenticated state-changing routes
 * - requireAuth populates req.user + req.session for authenticated routes
 */

const authService = require("../services/auth.service.js");
const sessionService = require("../services/sessions.service.js");
const passwordResetService = require("../services/passwordReset.service.js");

const {
  setSessionCookie,
  clearSessionCookie,
} = require("../utils/sessionCookie.js");

/* ========================================================================== */
/* Helpers                                                                     */
/* ========================================================================== */

function safeBody(req) {
  return req.body ?? {};
}

function asTrimmedString(value) {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length ? t : null;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function assertAuthedUserId(req) {
  const id = Number(req.user?.id);
  if (!Number.isInteger(id) || id <= 0) {
    // Should be impossible if requireAuth is correct; fail closed.
    throw badRequest("Invalid authenticated user");
  }
  return id;
}

/* ========================================================================== */
/* Handlers                                                                    */
/* ========================================================================== */

/**
 * POST /api/auth/register
 * Create a new user and an initial authenticated session.
 */
exports.register = async (req, res, next) => {
  try {
    const body = safeBody(req);

    const username = asTrimmedString(body.username);
    const email = asTrimmedString(body.email);
    const password = asTrimmedString(body.password);

    if (!username || !email || !password) {
      throw badRequest("username, email, and password are required");
    }

    const result = await authService.register({
      username,
      email,
      password,
      context: req.context,
    });

    setSessionCookie(res, result.session.sessionToken);

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
    const body = safeBody(req);

    const identifier = asTrimmedString(body.identifier);
    const password = asTrimmedString(body.password);

    if (!identifier || !password) {
      throw badRequest("identifier and password are required");
    }

    const result = await authService.login({
      identifier,
      password,
      context: req.context,
    });

    setSessionCookie(res, result.session.sessionToken);

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
 * Invalidate the current session (Auth + CSRF).
 */
exports.logout = async (req, res, next) => {
  try {
    // requireAuth should guarantee req.session exists, but fail safely.
    const sessionToken = req.session?.sessionToken;

    if (typeof sessionToken === "string" && sessionToken.length) {
      await sessionService.invalidateSession({ sessionToken });
    }

    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/change-password
 * Change the authenticated user's password (Auth + CSRF).
 */
exports.changePassword = async (req, res, next) => {
  try {
    const body = safeBody(req);

    const currentPassword = asTrimmedString(body.currentPassword);
    const newPassword = asTrimmedString(body.newPassword);

    if (!currentPassword || !newPassword) {
      throw badRequest("currentPassword and newPassword are required");
    }

    await authService.changePassword({
      userId: assertAuthedUserId(req),
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
    const body = safeBody(req);
    const email = asTrimmedString(body.email);

    if (!email) {
      throw badRequest("email is required");
    }

    await passwordResetService.requestResetForEmail({ email });

    // Always succeed to prevent user enumeration.
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/reset-password/confirm
 * Complete a password reset using a one-time token.
 */
exports.confirmPasswordReset = async (req, res, next) => {
  try {
    const body = safeBody(req);

    const token = asTrimmedString(body.token);
    const newPassword = asTrimmedString(body.newPassword);

    if (!token || !newPassword) {
      throw badRequest("token and newPassword are required");
    }

    const verification = await passwordResetService.verifyResetToken({
      rawToken: token,
    });

    if (!verification) {
      throw badRequest("Invalid or expired reset token");
    }

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
 * Return the CSRF token for the current session (Auth).
 */
exports.csrf = async (req, res, next) => {
  try {
    return res.status(200).json({ csrfToken: req.session.csrfToken });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/auth/me
 * Return the authenticated user's public profile (Auth).
 */
exports.me = async (req, res, next) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/auth/me
 * Delete the authenticated user and all sessions (Auth + CSRF).
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = assertAuthedUserId(req);

    await authService.deleteUserAndSessions({
      userId,
      requesterId: userId,
    });

    clearSessionCookie(res);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
