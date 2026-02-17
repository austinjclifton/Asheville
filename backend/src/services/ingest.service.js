"use strict";

/**
 * Ingest Service
 *
 * Responsibilities:
 * - Validate telemetry payload
 * - Enforce ingest-level business rules
 * - Persist telemetry via repository layer
 */

const readingRepo = require("../db/readings.db.js");

const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000; // 5 minutes
const TEMP_F_MIN = -100;
const TEMP_F_MAX = 150;

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function requirePositiveInt(field, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`Invalid ${field}`);
  }
  return n;
}

function parseDateLike(field, value) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`Invalid ${field} timestamp`);
  }

  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) {
    throw badRequest(`Invalid ${field} timestamp`);
  }

  return d;
}

function requireFiniteNumber(field, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw badRequest(`${field} must be numeric`);
  }
  return n;
}

function normalizeOptionalNumber(field, value) {
  if (value === undefined || value === null) return null;

  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw badRequest(`${field} must be numeric or null`);
  }
  return n;
}

exports.createReading = async ({
  deviceId,
  recordedAt,
  temperatureF,
  batteryVoltage = null,
  signalStrength = null,
}) => {
  const devId = requirePositiveInt("deviceId", deviceId);

  const recordedAtDate = parseDateLike("recordedAt", recordedAt);
  if (recordedAtDate.getTime() > Date.now() + MAX_FUTURE_SKEW_MS) {
    throw badRequest("recordedAt cannot be in the future");
  }

  const temp = requireFiniteNumber("temperatureF", temperatureF);
  if (temp < TEMP_F_MIN || temp > TEMP_F_MAX) {
    throw badRequest("temperatureF out of valid range");
  }

  const batt = normalizeOptionalNumber("batteryVoltage", batteryVoltage);
  if (batt !== null && batt < 0) {
    throw badRequest("batteryVoltage must be >= 0");
  }

  const rssi = normalizeOptionalNumber("signalStrength", signalStrength);

  return readingRepo.create({
    deviceId: devId,
    recordedAt: recordedAtDate,
    temperatureF: temp,
    batteryVoltage: batt,
    signalStrength: rssi,
  });
};
