/* -------------------------------------------------------------------------- */
/* Delete User                                                                */
/* -------------------------------------------------------------------------- */

/**
 * DELETE /api/auth/me
 *
 * Deletes the authenticated user's account and all sessions.
 * Requires authentication.
 */
exports.deleteUser = async (req, res, next) => {
  try {
    await authService.deleteUserAndSessions({
      userId: Number(req.user.id),
      requesterId: Number(req.user.id),
    });

    res.clearCookie("sessionId", getSessionClearOptions());
    return res.status(204).send();
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ error: "User not found" });
    }
    if (err.status === 403) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return next(err);
  }
};
("use strict");

/**
 * Auth Controller
 *
 * Responsibilities:
 * - Handle HTTP concerns only (Express req/res semantics)
 * - Validate incoming request shapes
 * - Delegate all business logic to services
 * - Translate service results/errors into HTTP responses
 * - Set and clear authentication cookies
 *
 * CSRF model:
 * - CSRF token REQUIRED for logout and authenticated state changes
 * - CSRF token returned at login and via /csrf
 * - Session token stored exclusively as HttpOnly cookie
 */

const authService = require("../services/auth.service.js");
const sessionService = require("../services/sessions.service.js");
const passwordResetService = require("../services/passwordReset.service.js");

/* -------------------------------------------------------------------------- */
/* Cookie helpers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Cookie options used when SETTING the session cookie.
 * Session lifetime is owned by the session service.
 */
function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

/**
 * Cookie options used when CLEARING the session cookie.
 */
function getSessionClearOptions() {
  return {
    path: "/",
  };
}

/**
 * Defensive helper for request bodies.
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
 * Creates a new user and an initial authenticated session.
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
      context: req.context,
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
      context: req.context,
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
 * Invalidates the current authenticated session.
 * CSRF token REQUIRED.
 */
exports.logout = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.sessionId;

    if (!sessionToken) {
      return res.status(200).json({ success: true });
    }

    await sessionService.invalidateSession({ sessionToken });

    res.clearCookie("sessionId", getSessionClearOptions());

    return res.status(200).json({ success: true });
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
      userId: Number(req.user.id),
      currentPassword,
      newPassword,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* Password Reset (Unauthenticated)                                            */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/auth/reset-password/request
 *
 * Initiates a password reset flow.
 * Always returns success to prevent account enumeration.
 */
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = safeBody(req);

    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    await passwordResetService.requestResetForEmail({ email });

    // Always succeed (no enumeration)
    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/auth/reset-password/confirm
 *
 * Completes a password reset using a one-time reset token.
 */
exports.confirmPasswordReset = async (req, res, next) => {
  try {
    const { token, newPassword } = safeBody(req);

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "token and newPassword are required",
      });
    }

    // 1️⃣ Verify token but DO NOT consume it
    const verification = await passwordResetService.verifyResetToken({
      rawToken: token,
    });

    if (!verification) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    // 2️⃣ Attempt password reset (can fail safely)
    await authService.resetPassword({
      userId: Number(verification.userId),
      newPassword,
    });

    // 3️⃣ Consume token ONLY after success
    await passwordResetService.consumeResetTokenForUser({
      userId: verification.userId,
    });

    return res.status(200).json({ success: true });
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
 * Returns the CSRF token for the current authenticated session.
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
 * Returns the authenticated user's public profile.
 */
exports.me = async (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
};
