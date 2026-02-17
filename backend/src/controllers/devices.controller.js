"use strict";

/**
 * Devices Controller
 *
 * Responsibilities:
 * - HTTP boundary only (Express req/res)
 * - Minimal parsing (ids) and pass-through of optional fields
 * - Delegate all domain validation + invariants to service
 * - Use next(err) consistently (no inline error mapping)
 */

const deviceService = require("../services/devices.service.js");

/* ========================================================================== */
/* Helpers                                                                     */
/* ========================================================================== */

function safeBody(req) {
  return req.body ?? {};
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function parsePositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
  return n;
}

function beekeeperIdFromReq(req) {
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
 * POST /api/devices
 * Create a device for a hive (hiveId provided in the body).
 *
 * Note: only keep this handler if you actually route POST /api/devices.
 */
exports.create = async (req, res, next) => {
  try {
    const body = safeBody(req);

    if (body.hiveId === undefined) {
      throw badRequest("hiveId is required");
    }

    const device = await deviceService.createDevice({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: parsePositiveInt(body.hiveId, "hiveId"),
      installedAt: body.installedAt, // undefined/null/string/Date; service validates
    });

    if (!device) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(201).json({ device });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/hives/:hiveId/devices
 * Create a device under a specific hive (hiveId comes from the path).
 */
exports.createForHive = async (req, res, next) => {
  try {
    const body = safeBody(req);

    const device = await deviceService.createDevice({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: parsePositiveInt(req.params.hiveId, "hiveId"),
      installedAt: body.installedAt,
    });

    if (!device) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(201).json({ device });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/devices
 * List all devices for the authenticated beekeeper.
 */
exports.list = async (req, res, next) => {
  try {
    const devices = await deviceService.listDevices({
      beekeeperId: beekeeperIdFromReq(req),
    });

    return res.status(200).json({ devices });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/hives/:hiveId/devices
 * List devices under a specific hive (scoped).
 */
exports.listForHive = async (req, res, next) => {
  try {
    const devices = await deviceService.listDevicesForHive({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: parsePositiveInt(req.params.hiveId, "hiveId"),
    });

    if (devices === null) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(200).json({ devices });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/devices/:id
 * Get a single device by id (scoped).
 */
exports.getById = async (req, res, next) => {
  try {
    const device = await deviceService.getDevice({
      beekeeperId: beekeeperIdFromReq(req),
      deviceId: parsePositiveInt(req.params.id, "id"),
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    return res.status(200).json({ device });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/devices/:id/last-seen
 * Update last-seen timestamp for a device (scoped).
 */
exports.touchLastSeen = async (req, res, next) => {
  try {
    const body = safeBody(req);

    const device = await deviceService.touchLastSeen({
      beekeeperId: beekeeperIdFromReq(req),
      deviceId: parsePositiveInt(req.params.id, "id"),
      seenAt: body.seenAt, // undefined => repo defaults now()
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    return res.status(200).json({ device });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/devices/:id
 * Delete a device (scoped).
 */
exports.remove = async (req, res, next) => {
  try {
    const deleted = await deviceService.deleteDevice({
      beekeeperId: beekeeperIdFromReq(req),
      deviceId: parsePositiveInt(req.params.id, "id"),
    });

    if (!deleted) {
      return res.status(404).json({ error: "Device not found" });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
