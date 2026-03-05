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
    const payload = normalizePayload(req.body);

    const deviceId = payload.deviceId;
    const temperature = payload.temperature ?? payload.temp;
    const rssi = payload.rssi ?? payload.signalStrength ?? payload.rssiDbm;

    const result = await ingestService.createReading({
      deviceId,
      temperature,
      rssi,
    });

    if (!result.inserted) {
      return res.status(409).json({
        success: false,
        inserted: false,
        error: "Reading already exists for this 10-minute bucket",
      });
    }

    return res.status(201).json({
      success: true,
      inserted: true,
      reading: result.reading ?? undefined,
    });
  } catch (err) {
    return next(err);
  }
};

function normalizePayload(body) {
  const b = body ?? {};
  return b.payload ?? b;
}