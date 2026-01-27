"use strict";

/**
 * Device Controller
 *
 * Responsibilities:
 * - HTTP concerns only (Express req/res semantics)
 * - Validate incoming request shapes
 * - Call the service layer
 * - Translate service results into HTTP responses
 */

const deviceService = require("../services/device.service.js");

/**
 * GET /api/devices
 *
 * Returns all devices belonging to hives owned by the user.
 */
exports.list = async (req, res, next) => {
  try {
    const devices = await deviceService.getDevicesForUser({
      beekeeperId: req.user.id,
    });

    return res.status(200).json({ devices });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/devices
 *
 * Body:
 * {
 *   hiveId: number
 * }
 */
exports.create = async (req, res, next) => {
  try {
    const { hiveId } = req.body ?? {};

    if (!hiveId) {
      return res.status(400).json({
        error: "hiveId is required",
      });
    }

    const device = await deviceService.createDevice({
      hiveId,
      beekeeperId: req.user.id,
    });

    if (!device) {
      return res.status(404).json({
        error: "Hive not found",
      });
    }

    return res.status(201).json({ device });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/devices/:deviceId
 */
exports.get = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const device = await deviceService.getDeviceById({
      deviceId,
      beekeeperId: req.user.id,
    });

    if (!device) {
      return res.status(404).json({
        error: "Device not found",
      });
    }

    return res.status(200).json({ device });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/devices/:deviceId
 *
 * Body:
 * {
 *   active: boolean
 * }
 */
exports.update = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { active } = req.body ?? {};

    if (active === undefined) {
      return res.status(400).json({
        error: "active flag is required",
      });
    }

    const device = await deviceService.updateDevice({
      deviceId,
      beekeeperId: req.user.id,
      updates: { active },
    });

    if (!device) {
      return res.status(404).json({
        error: "Device not found",
      });
    }

    return res.status(200).json({ device });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/devices/:deviceId
 */
exports.remove = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const deleted = await deviceService.deleteDevice({
      deviceId,
      beekeeperId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({
        error: "Device not found",
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};
