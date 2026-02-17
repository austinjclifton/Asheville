"use strict";

/**
 * Devices Controller
 *
 * Responsibilities:
 * - Validate HTTP input
 * - Call service layer
 * - Return correct HTTP codes
 */

const deviceService = require("../services/devices.service.js");

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function parsePositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: `${field} must be a positive integer` };
  }
  return { ok: true, value: n };
}

function parseOptionalDate(value, field) {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null) return { ok: true, value: null };

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: `${field} must be a valid ISO8601 timestamp` };
  }

  return { ok: true, value: d.toISOString() };
}

function beekeeperIdFromReq(req) {
  return Number(req.user.id);
}

function handleServiceError(res, err) {
  // If service sets err.status, respond consistently here.
  if (err && Number.isInteger(err.status)) {
    return res.status(err.status).json({ error: err.message });
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* POST /api/devices                                                           */
/* Body: { hiveId, installedAt? }                                              */
/* -------------------------------------------------------------------------- */

exports.create = async (req, res, next) => {
  try {
    const { hiveId, installedAt } = req.body ?? {};

    const hiveParsed = parsePositiveInt(hiveId, "hiveId");
    if (!hiveParsed.ok) {
      return res.status(400).json({ error: hiveParsed.error });
    }

    const installedParsed = parseOptionalDate(installedAt, "installedAt");
    if (!installedParsed.ok) {
      return res.status(400).json({ error: installedParsed.error });
    }

    const device = await deviceService.createDevice({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: hiveParsed.value,
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
};

/* -------------------------------------------------------------------------- */
/* POST /api/hives/:hiveId/devices                                             */
/* Body: { installedAt? }                                                     */
/* -------------------------------------------------------------------------- */

exports.createForHive = async (req, res, next) => {
  try {
    const hiveParsed = parsePositiveInt(req.params.hiveId, "hiveId");
    if (!hiveParsed.ok) {
      return res.status(400).json({ error: hiveParsed.error });
    }

    const { installedAt } = req.body ?? {};
    const installedParsed = parseOptionalDate(installedAt, "installedAt");
    if (!installedParsed.ok) {
      return res.status(400).json({ error: installedParsed.error });
    }

    const device = await deviceService.createDevice({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: hiveParsed.value,
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
};

/* -------------------------------------------------------------------------- */
/* GET /api/devices                                                            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* GET /api/hives/:hiveId/devices                                              */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* GET /api/devices/:id                                                        */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* POST /api/devices/:id/last-seen                                             */
/* Body: { seenAt? }                                                          */
/* -------------------------------------------------------------------------- */

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
      seenAt: seenParsed.value, // undefined => repo uses now()
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    return res.status(200).json({ device });
  } catch (err) {
    // If you added handleServiceError earlier, use it here too.
    // const handled = handleServiceError(res, err);
    // if (handled) return handled;
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE /api/devices/:id                                                     */
/* -------------------------------------------------------------------------- */

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
