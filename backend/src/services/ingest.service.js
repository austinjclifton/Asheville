"use strict";

/**
 * Ingest Service
 *
 * Responsibilities
 * - Validate ingest payload fields
 * - Compute server-side 10 minute bucket timestamp
 * - Write reading using dedupe insert
 * - Optionally trigger external conditions ingest after successful insert
 *
 * Notes
 * - This service is HTTP-agnostic
 * - Repository owns SQL and table details
 */

const readingIngestRepo = require("../db/ingest.db.js");
const externalConditionsService = require("./externalConditions.service.js");

/* ========================================================================== */
/* Config                                                                      */
/* ========================================================================== */

const TEN_MIN_MS = 10 * 60 * 1000;

const TEMP_MIN = -100;
const TEMP_MAX = 150;

const RSSI_MIN = -200;
const RSSI_MAX = 0;

const TRIGGER_EXTERNAL_ON_INGEST =
  String(process.env.TRIGGER_EXTERNAL_ON_INGEST ?? "true")
    .toLowerCase()
    .trim() === "true";

/* ========================================================================== */
/* Public API                                                                  */
/* ========================================================================== */

exports.createReading = async ({ deviceId, temperature, rssi }) => {
  const devId = requirePositiveInt("deviceId", deviceId);

  //const bucketAt = floorToTenMinutes(new Date());
  const bucketAt = new Date().toISOString();

  const temp = requireFiniteNumber("temperature", temperature);
  if (!(temp > TEMP_MIN && temp < TEMP_MAX)) {
    throw badRequest("temperature out of valid range");
  }

  const rssiInt = requireInteger("rssi", rssi);
  if (rssiInt < RSSI_MIN || rssiInt > RSSI_MAX) {
    throw badRequest("rssi out of valid range");
  }

  const { inserted, reading } = await readingIngestRepo.createReadingDeduped10m({
    deviceId: devId,
    bucketAt,
    temperatureC: temp,
    rssiDbm: rssiInt,
  });

  if (inserted && TRIGGER_EXTERNAL_ON_INGEST) {
    try {
      await externalConditionsService.ingestCurrentForDevice({ deviceId: devId });
    } catch (e) {
      // Intentional swallow to avoid failing ingest when external fetch fails
      console.error("External condition ingest failed:", e?.message || e);
    }
  }

  return { inserted, reading };
};

/* ========================================================================== */
/* Errors                                                                      */
/* ========================================================================== */

function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function badRequest(message) {
  return httpError(400, "VALIDATION_ERROR", message);
}

/* ========================================================================== */
/* Validation                                                                  */
/* ========================================================================== */

function requirePositiveInt(field, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
  return n;
}

function requireFiniteNumber(field, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw badRequest(`${field} must be numeric`);
  }
  return n;
}

function requireInteger(field, value) {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    throw badRequest(`${field} must be an integer`);
  }
  return n;
}

/* ========================================================================== */
/* Time                                                                        */
/* ========================================================================== */

function floorToTenMinutes(date) {
  const ms = date.getTime();
  return new Date(Math.floor(ms / TEN_MIN_MS) * TEN_MIN_MS);
}