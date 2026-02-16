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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function isValidDate(value) {
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/* -------------------------------------------------------------------------- */
/* Create Reading                                                             */
/* -------------------------------------------------------------------------- */

exports.createReading = async ({
  deviceId,
  recordedAt,
  temperatureF,
  batteryVoltage = null,
  signalStrength = null,
}) => {
  /* ---------------------------------------------------------------
   * Device validation
   * --------------------------------------------------------------- */

  if (!Number.isInteger(deviceId) || deviceId <= 0) {
    throw badRequest("Invalid deviceId");
  }

  /* ---------------------------------------------------------------
   * Timestamp validation
   * --------------------------------------------------------------- */

  if (!recordedAt || !isValidDate(recordedAt)) {
    throw badRequest("Invalid recordedAt timestamp");
  }

  const recordedAtDate = new Date(recordedAt);

  // Prevent spoofing far future timestamps
  if (recordedAtDate.getTime() > Date.now() + 5 * 60 * 1000) {
    throw badRequest("recordedAt cannot be in the future");
  }

  /* ---------------------------------------------------------------
   * Temperature validation
   * --------------------------------------------------------------- */

  if (typeof temperatureF !== "number" || Number.isNaN(temperatureF)) {
    throw badRequest("temperatureF must be numeric");
  }

  // Match your DB constraint range for consistency
  if (temperatureF <= -100 || temperatureF >= 150) {
    throw badRequest("temperatureF out of valid range");
  }

  /* ---------------------------------------------------------------
   * Optional fields validation
   * --------------------------------------------------------------- */

  if (
    batteryVoltage !== null &&
    (typeof batteryVoltage !== "number" || Number.isNaN(batteryVoltage))
  ) {
    throw badRequest("batteryVoltage must be numeric or null");
  }

  if (batteryVoltage !== null && batteryVoltage < 0) {
    throw badRequest("batteryVoltage must be >= 0");
  }

  if (
    signalStrength !== null &&
    (typeof signalStrength !== "number" || Number.isNaN(signalStrength))
  ) {
    throw badRequest("signalStrength must be numeric or null");
  }

  /* ---------------------------------------------------------------
   * Persist reading
   * --------------------------------------------------------------- */

  return readingRepo.create({
    deviceId,
    recordedAt: recordedAtDate,
    temperatureF,
    batteryVoltage,
    signalStrength,
  });
};
