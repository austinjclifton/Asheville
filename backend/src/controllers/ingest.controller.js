"use strict";

/**
 * Ingest Controller
 *
 * Responsibilities:
 * - HTTP boundary only (Express req/res)
 * - Minimal required-field presence checks
 * - Delegate validation/policy to service layer
 */

const ingestService = require("../services/ingest.service.js");

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

/* ========================================================================== */
/* Handlers                                                                    */
/* ========================================================================== */

/**
 * POST /api/ingest/readings
 * Accept telemetry payload from a device.
 */
exports.create = async (req, res, next) => {
  try {
    const body = safeBody(req);

    // Minimal presence checks only (service handles types/ranges).
    if (body.deviceId === undefined) throw badRequest("deviceId is required");
    if (body.recordedAt === undefined) throw badRequest("recordedAt is required");
    if (body.temperatureF === undefined) throw badRequest("temperatureF is required");

    await ingestService.createReading({
      deviceId: body.deviceId,               // pass-through
      recordedAt: body.recordedAt,           // pass-through
      temperatureF: body.temperatureF,       // pass-through
      batteryVoltage: body.batteryVoltage ?? null,
      signalStrength: body.signalStrength ?? null,
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    return next(err);
  }
};
