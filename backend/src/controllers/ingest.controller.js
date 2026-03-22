"use strict";

const ingestService = require("../services/ingest.service.js");

const API_TIME_ZONE = String(process.env.API_TIME_ZONE || "America/New_York");

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

    const reading = formatReadingForApi(result.reading);

    // return 201 if the reading was successfully inserted
    return res.status(201).json({
      success: true,
      inserted: true,
      reading: reading ?? undefined,
    });
  } catch (err) {
    return next(err);
  }
};

function formatReadingForApi(reading) {
  if (!reading || typeof reading !== "object") return reading;

  return {
    ...reading,
    bucket_at: formatDateNoOffset(reading.bucket_at),
    received_at: formatDateNoOffset(reading.received_at),
    created_at: formatDateNoOffset(reading.created_at),
  };
}

function formatDateNoOffset(value) {
  if (value === null || value === undefined || value === "") return value;

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: API_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const part = (type) => parts.find((p) => p.type === type)?.value || "00";
  const ms = String(date.getMilliseconds()).padStart(3, "0");

  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}.${ms}`;
}
