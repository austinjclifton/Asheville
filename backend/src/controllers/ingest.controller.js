"use strict";

/**
 * Ingest Controller
 *
 * Responsibilities:
 * - Validate telemetry payload
 * - Call ingest service
 * - Return minimal response
 */

const ingestService = require("../services/ingest.service.js");

exports.create = async (req, res, next) => {
  try {
    const {
      deviceId,
      recordedAt,
      temperatureF,
      batteryVoltage,
      signalStrength,
    } = req.body ?? {};

    if (!deviceId || !recordedAt || temperatureF === undefined) {
      return res.status(400).json({
        error: "deviceId, recordedAt, and temperatureF are required",
      });
    }

    await ingestService.createReading({
      deviceId: Number(deviceId),
      recordedAt,
      temperatureF: Number(temperatureF),
      batteryVoltage:
        batteryVoltage !== undefined ? Number(batteryVoltage) : null,
      signalStrength:
        signalStrength !== undefined ? Number(signalStrength) : null,
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    return next(err);
  }
};
