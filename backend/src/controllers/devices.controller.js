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

    // Service should return null when hive not found/not owned
    if (!device) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(201).json({ device });
  } catch (err) {
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

    // You can choose whether “hive not found” should be 404 vs empty [].
    // I recommend 404 so clients can distinguish between "no devices" and "bad hive".
    if (devices === null) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(200).json({ devices });
  } catch (err) {
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
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* PATCH /api/devices/:id                                                      */
/* Body: { installedAt?, lastSeenAt? }                                        */
/* -------------------------------------------------------------------------- */

exports.update = async (req, res, next) => {
  try {
    const idParsed = parsePositiveInt(req.params.id, "id");
    if (!idParsed.ok) {
      return res.status(400).json({ error: idParsed.error });
    }

    const { installedAt, lastSeenAt } = req.body ?? {};

    const installedParsed = parseOptionalDate(installedAt, "installedAt");
    if (!installedParsed.ok) {
      return res.status(400).json({ error: installedParsed.error });
    }

    const lastSeenParsed = parseOptionalDate(lastSeenAt, "lastSeenAt");
    if (!lastSeenParsed.ok) {
      return res.status(400).json({ error: lastSeenParsed.error });
    }

    if (
      installedParsed.value === undefined &&
      lastSeenParsed.value === undefined
    ) {
      return res.status(400).json({
        error: "Provide at least one field to update",
      });
    }

    const device = await deviceService.updateDevice({
      beekeeperId: beekeeperIdFromReq(req),
      deviceId: idParsed.value,
      installedAt: installedParsed.value,
      lastSeenAt: lastSeenParsed.value,
    });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    return res.status(200).json({ device });
  } catch (err) {
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
    return next(err);
  }
};
