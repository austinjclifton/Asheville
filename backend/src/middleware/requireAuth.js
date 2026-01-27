/**
 * Session auth middleware:
 * Purpose:
 * - validates session, binds request context, attaches user
 */

const sessionService = require("../services/session.service");

exports.requireAuth = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.sessionId;

    if (!sessionId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    const session = await sessionService.validateSession(sessionId, context);

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // hard guarantees for downstream code
    req.user = session.user;
    req.session = {
      id: session.id,
      expiresAt: session.expiresAt,
    };

    next();
  } catch (err) {
    next(err);
  }
};
