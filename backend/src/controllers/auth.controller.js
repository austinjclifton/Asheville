/**
 * Auth Controller
 *
 * - credential-based authentication
 * - user creation
 * - password management
 */

const authService = require("../services/auth.service");

/**
 * POST /api/auth/register
 *
 * Creates a new user and initial session.
 */
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const result = await authService.register({
      username,
      email,
      password,
      context: {
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
    });

    res.cookie("sessionId", result.session.id, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ user: result.user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 *
 * Authenticates credentials and creates a session.
 */
exports.login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const result = await authService.login({
      identifier,
      password,
      context: {
        ip: req.ip,
        userAgent: req.get("user-agent"),
      },
    });

    res.cookie("sessionId", result.session.id, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ user: result.user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/change-password
 *
 * Changes authenticated user's password.
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword({
      userId: req.user.id,
      currentPassword,
      newPassword,
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
