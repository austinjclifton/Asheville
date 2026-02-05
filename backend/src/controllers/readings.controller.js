"use strict";

/**
 * Reading Controller
 *
 * Responsibilities:
 * - HTTP concerns only (Express req/res semantics)
 * - Validate incoming request shapes
 * - Call the service layer
 * - Translate service results into HTTP responses
 */

const readingService = require("../services/readings.service.js");

/**
 * GET /api/readings
 *
 * Query params:
 * - deviceId?: number
 * - hiveId?: number
 * - from?: ISO8601 timestamp
 * - to?: ISO8601 timestamp
 * - limit?: number
 */
exports.list = async (req, res, next) => {
  try {
    const { deviceId, hiveId, from, to, limit } = req.query ?? {};

    if (deviceId && hiveId) {
      return res.status(400).json({
        error: "Specify either deviceId or hiveId, not both",
      });
    }

    const readings = await readingService.getReadingsForUser({
      beekeeperId: req.user.id,
      deviceId: deviceId ? Number(deviceId) : undefined,
      hiveId: hiveId ? Number(hiveId) : undefined,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({ readings });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/readings/latest
 *
 * Query params:
 * - deviceId?: number
 * - hiveId?: number
 */
exports.latest = async (req, res, next) => {
  try {
    const { deviceId, hiveId } = req.query ?? {};

    if (!deviceId && !hiveId) {
      return res.status(400).json({
        error: "deviceId or hiveId is required",
      });
    }

    if (deviceId && hiveId) {
      return res.status(400).json({
        error: "Specify either deviceId or hiveId, not both",
      });
    }

    const reading = await readingService.getLatestReadingForUser({
      beekeeperId: req.user.id,
      deviceId: deviceId ? Number(deviceId) : undefined,
      hiveId: hiveId ? Number(hiveId) : undefined,
    });

    if (!reading) {
      return res.status(404).json({
        error: "No readings found",
      });
    }

    return res.status(200).json({ reading });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/devices/:deviceId/readings
 */
exports.listForDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { from, to, limit } = req.query ?? {};

    const readings = await readingService.getReadingsForUser({
      beekeeperId: req.user.id,
      deviceId: Number(deviceId),
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({ readings });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/hives/:hiveId/readings
 */
exports.listForHive = async (req, res, next) => {
  try {
    const { hiveId } = req.params;
    const { from, to, limit } = req.query ?? {};

    const readings = await readingService.getReadingsForUser({
      beekeeperId: req.user.id,
      hiveId: Number(hiveId),
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({ readings });
  } catch (err) {
    return next(err);
  }
};
