"use strict";

/**
 * Ingest Service
 *
 * Responsibilities:
 * - Validate telemetry payload
 * - Enforce ingest-level business rules
 * - Persist telemetry via repository layer
 *
 * This service:
 * - Knows business rules
 * - Does NOT know HTTP
 * - Does NOT know SQL
 */

const readingRepo = require("../db/readings.db.js");

const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000; // 5 minutes
const TEMP_F_MIN = -100;
const TEMP_F_MAX = 150;

/**
 * Create a 400 error for invalid inputs.
 */
function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

/**
 * Parse a required date-like input into a Date.
 */
function parseDateLike(field, value) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`Invalid ${field} timestamp`);
  }

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw badRequest(`Invalid ${field} timestamp`);
  }

  return d;
}

/**
 * Require a finite number (not NaN / Infinity).
 */
function requireFiniteNumber(field, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw badRequest(`${field} must be numeric`);
  }
  return value;
}

/**
 * Normalize an optional number (allows null).
 */
function normalizeOptionalNumber(field, value) {
  if (value === null) return null;
  if (value === undefined) return null;

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw badRequest(`${field} must be numeric or null`);
  }
  return value;
}

/**
 * Create a reading from telemetry data.
 */
exports.createReading = async ({
  deviceId,
  recordedAt,
  temperatureF,
  batteryVoltage = null,
  signalStrength = null,
}) => {
  // Device validation
  if (!Number.isInteger(deviceId) || deviceId <= 0) {
    throw badRequest("Invalid deviceId");
  }

  // Timestamp validation
  const recordedAtDate = parseDateLike("recordedAt", recordedAt);

  // Prevent spoofing far-future timestamps.
  if (recordedAtDate.getTime() > Date.now() + MAX_FUTURE_SKEW_MS) {
    throw badRequest("recordedAt cannot be in the future");
  }

  // Temperature validation (match DB range constraints).
  const temp = requireFiniteNumber("temperatureF", temperatureF);
  if (temp <= TEMP_F_MIN || temp >= TEMP_F_MAX) {
    throw badRequest("temperatureF out of valid range");
  }

  // Optional field validation
  const batt = normalizeOptionalNumber("batteryVoltage", batteryVoltage);
  if (batt !== null && batt < 0) {
    throw badRequest("batteryVoltage must be >= 0");
  }

  const rssi = normalizeOptionalNumber("signalStrength", signalStrength);

  // Persist reading
  return readingRepo.create({
    deviceId,
    recordedAt: recordedAtDate,
    temperatureF: temp,
    batteryVoltage: batt,
    signalStrength: rssi,
  });
};
