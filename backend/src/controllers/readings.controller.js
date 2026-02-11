"use strict";

/**
 * Readings Controller
 *
 * Responsibilities:
 * - HTTP concerns only
 * - Validate and normalize query parameters
 * - Call service layer
 * - Translate service results into HTTP responses
 *
 * Notes:
 * - Read-only (telemetry is immutable)
 * - Ownership enforced in service layer
 */

const readingService = require("../services/readings.service.js");

/* -------------------------------------------------------------------------- */
/* Utilities                                                                   */
/* -------------------------------------------------------------------------- */

function parseOptionalInt(value, fieldName) {
  if (value === undefined) return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const err = new Error(`${fieldName} must be a positive integer`);
    err.status = 400;
    throw err;
  }

  return parsed;
}

function parseOptionalDate(value, fieldName) {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const err = new Error(`${fieldName} must be a valid ISO8601 timestamp`);
    err.status = 400;
    throw err;
  }

  return date.toISOString();
}

/* -------------------------------------------------------------------------- */
/* GET /api/readings                                                           */
/* -------------------------------------------------------------------------- */

exports.list = async (req, res, next) => {
  try {
    const { deviceId, hiveId, from, to, limit } = req.query ?? {};

    if (deviceId && hiveId) {
      return res.status(400).json({
        error: "Specify either deviceId or hiveId, not both",
      });
    }

    const normalizedDeviceId = parseOptionalInt(deviceId, "deviceId");
    const normalizedHiveId = parseOptionalInt(hiveId, "hiveId");
    const normalizedFrom = parseOptionalDate(from, "from");
    const normalizedTo = parseOptionalDate(to, "to");

    let normalizedLimit;
    if (limit !== undefined) {
      normalizedLimit = parseOptionalInt(limit, "limit");

      if (normalizedLimit > 1000) {
        return res.status(400).json({
          error: "limit cannot exceed 1000",
        });
      }
    }

    const readings = await readingService.getReadingsForUser({
      beekeeperId: req.user.id,
      deviceId: normalizedDeviceId,
      hiveId: normalizedHiveId,
      from: normalizedFrom,
      to: normalizedTo,
      limit: normalizedLimit,
    });

    return res.status(200).json({ readings });
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/readings/latest                                                    */
/* -------------------------------------------------------------------------- */

exports.latest = async (req, res, next) => {
  try {
    const { deviceId, hiveId } = req.query ?? {};

    if (deviceId && hiveId) {
      return res.status(400).json({
        error: "Specify either deviceId or hiveId, not both",
      });
    }

    const normalizedDeviceId = parseOptionalInt(deviceId, "deviceId");
    const normalizedHiveId = parseOptionalInt(hiveId, "hiveId");

    const readings = await readingService.getLatestReadingsForUser({
      beekeeperId: req.user.id,
      deviceId: normalizedDeviceId,
      hiveId: normalizedHiveId,
    });

    return res.status(200).json({ readings });
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/readings/stats                                                     */
/* -------------------------------------------------------------------------- */

exports.stats = async (req, res, next) => {
  try {
    const { deviceId, hiveId, from, to } = req.query ?? {};

    if (deviceId && hiveId) {
      return res.status(400).json({
        error: "Specify either deviceId or hiveId, not both",
      });
    }

    const normalizedDeviceId = parseOptionalInt(deviceId, "deviceId");
    const normalizedHiveId = parseOptionalInt(hiveId, "hiveId");
    const normalizedFrom = parseOptionalDate(from, "from");
    const normalizedTo = parseOptionalDate(to, "to");

    const stats = await readingService.getReadingStatsForUser({
      beekeeperId: req.user.id,
      deviceId: normalizedDeviceId,
      hiveId: normalizedHiveId,
      from: normalizedFrom,
      to: normalizedTo,
    });

    return res.status(200).json({ stats });
  } catch (err) {
    return next(err);
  }
};
