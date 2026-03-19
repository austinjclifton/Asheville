"use strict";

const ingestService = require("../services/ingest.service.js");

/**
 * POST /ingest/readings
 *
 * Header (handled by middleware):
 * - x-ingest-token: <token>
 *
 * Body:
 * - { deviceId, temperature, rssi }
 *
 * Rules:
 * - deviceId, temperature, rssi are required
 * - recordedAt is NOT accepted from clients; server computes bucket_at
 * - If a reading already exists for (deviceId, current 10-minute bucket) -> 409
 */
exports.create = async (req, res, next) => {
  try {
    const payload = req.body;
    const { deviceId, temperature, rssi } = payload;

    const result = await ingestService.createReading({
      deviceId,
      temperature,
      rssi,
    });

    // return 409 if a reading has occured within the 10 min. bucket for this device
    if (!result.inserted) {
      return res.status(409).json({
        success: false,
        inserted: false,
        error: "Reading already exists for this 10-minute bucket",
      });
    }

    // return 201 if the reading was successfully inserted
    return res.status(201).json({
      success: true,
      inserted: true,
      reading: result.reading ?? undefined,
    });
  } catch (err) {
    return next(err);
  }
};
