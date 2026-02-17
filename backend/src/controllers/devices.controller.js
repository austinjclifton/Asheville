"use strict";

/**
 * Devices Controller
 *
 * Responsibilities:
 * - Validate HTTP inputs
 * - Delegate to service layer
 * - Translate outcomes into HTTP responses
 */

const deviceService = require("../services/devices.service.js");

/**
 * Parse a required positive integer (path/query/body ids).
 */
function parsePositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: `${field} must be a positive integer` };
  }
  return { ok: true, value: n };
}

/**
 * Parse an optional ISO8601 timestamp.
 * - undefined => not provided
 * - null => explicit null (allowed for nullable fields)
 * - valid string/date => normalized to ISO string
 */
function parseOptionalDate(value, field) {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null) return { ok: true, value: null };

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: `${field} must be a valid ISO8601 timestamp` };
  }

  return { ok: true, value: d.toISOString() };
}

/**
 * Extract authenticated beekeeper id from requireAuth context.
 */
function beekeeperIdFromReq(req) {
  return Number(req.user.id);
}

/**
 * If a service throws an Error with a numeric status, respond consistently here.
 * Returns the response if handled, otherwise null so caller can next(err).
 */
function handleServiceError(res, err) {
  if (err && Number.isInteger(err.status)) {
    return res.status(err.status).json({ error: err.message });
  }
  return null;
}

/**
 * Shared create implementation used by both create routes.
 */
async function createDeviceForHive(req, res, next, hiveId) {
  try {
    const { installedAt } = req.body ?? {};

    const installedParsed = parseOptionalDate(installedAt, "installedAt");
    if (!installedParsed.ok) {
      return res.status(400).json({ error: installedParsed.error });
    }

    const device = await deviceService.createDevice({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId,
      installedAt: installedParsed.value ?? null,
    });

    if (!device) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(201).json({ device });
  } catch (err) {
    const handled = handleServiceError(res, err);
    if (handled) return handled;
    return next(err);
  }
}

/**
 * POST /api/devices
 * Create a device for a hive (hiveId is provided in the body).
 */
exports.create = async (req, res, next) => {
  const { hiveId } = req.body ?? {};

  const hiveParsed = parsePositiveInt(hiveId, "hiveId");
  if (!hiveParsed.ok) {
    return res.status(400).json({ error: hiveParsed.error });
  }

  return createDeviceForHive(req, res, next, hiveParsed.value);
};

/**
 * POST /api/hives/:hiveId/devices
 * Create a device under a specific hive (hiveId comes from the path).
 */
exports.createForHive = async (req, res, next) => {
  const hiveParsed = parsePositiveInt(req.params.hiveId, "hiveId");
  if (!hiveParsed.ok) {
    return res.status(400).json({ error: hiveParsed.error });
  }

  return createDeviceForHive(req, res, next, hiveParsed.value);
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
    const handled = handleServiceError(res, err);
    if (handled) return handled;
    return next(err);
  }
};

/**
 * GET /api/hives/:hiveId/devices
 * List devices under a specific hive (scoped).
 */
exports.listForHive = async (req, res, next) => {
  try {
    const hiveParsed = parsePositiveInt(req.params.hiveId, "hiveId");
    if (!hiveParsed.ok) {
      return res.status(400).json({ error: hiveParsed.error });
    }

    const devices = await deviceService.listDevicesForHive({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: hiveParsed.value,
    });

    if (devices === null) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(200).json({ devices });
  } catch (err) {
    const handled = handleServiceError(res, err);
    if (handled) return handled;
    return next(err);
  }
};

/**
 * GET /api/devices/:id
 * Get a single device by id (scoped).
 */
exports.getById = async (req, res, next) => {
  try {
    const parsed = parsePositiveInt(req.params.id, "id");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }

    const device = await deviceService.getDevice({
      beekeeperId: beekeeperIdFromReq(req),
      deviceId: parsed.value,
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    return res.status(200).json({ device });
  } catch (err) {
    const handled = handleServiceError(res, err);
    if (handled) return handled;
    return next(err);
  }
};

/**
 * POST /api/devices/:id/last-seen
 * Update last-seen timestamp for a device (scoped).
 */
exports.touchLastSeen = async (req, res, next) => {
  try {
    const parsed = parsePositiveInt(req.params.id, "id");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }

    const { seenAt } = req.body ?? {};
    const seenParsed = parseOptionalDate(seenAt, "seenAt");
    if (!seenParsed.ok) {
      return res.status(400).json({ error: seenParsed.error });
    }

    const device = await deviceService.touchLastSeen({
      beekeeperId: beekeeperIdFromReq(req),
      deviceId: parsed.value,
      seenAt: seenParsed.value, // undefined => service/repo can default to now()
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    return res.status(200).json({ device });
  } catch (err) {
    const handled = handleServiceError(res, err);
    if (handled) return handled;
    return next(err);
  }
};

/**
 * DELETE /api/devices/:id
 * Delete a device (scoped).
 */
exports.remove = async (req, res, next) => {
  try {
    const parsed = parsePositiveInt(req.params.id, "id");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }

    const deleted = await deviceService.deleteDevice({
      beekeeperId: beekeeperIdFromReq(req),
      deviceId: parsed.value,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Device not found" });
    }

    return res.status(204).send();
  } catch (err) {
    const handled = handleServiceError(res, err);
    if (handled) return handled;
    return next(err);
  }
};
