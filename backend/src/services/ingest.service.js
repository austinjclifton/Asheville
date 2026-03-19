"use strict";

const ingestRepo = require("../db/ingest.db.js");
const externalConditionsService = require("./externalConditions.service.js");

const TEN_MIN_MS = 10 * 60 * 1000;

const TEMP_MIN = -100;
const TEMP_MAX = 999;

const RSSI_MIN = -200;
const RSSI_MAX = 0;

const TRIGGER_EXTERNAL_ON_INGEST =
  String(process.env.TRIGGER_EXTERNAL_ON_INGEST ?? "true")
    .toLowerCase()
    .trim() === "true";

exports.createReading = async ({ deviceId, temperature, rssi }) => {
  const devId = requirePositiveIntLike("deviceId", deviceId);
  const temp = requireFloatLike("temperature", temperature);
  const rssiInt = requireIntLike("rssi", rssi);

  if (temp <= TEMP_MIN || temp >= TEMP_MAX) {
    throw badRequest(`temperature must be between ${TEMP_MIN} and ${TEMP_MAX}`);
  }

  if (rssiInt < RSSI_MIN || rssiInt > RSSI_MAX) {
    throw badRequest(`rssi must be between ${RSSI_MIN} and ${RSSI_MAX}`);
  }

  // Use this for real 10-minute dedupe behavior.
  //const bucketAt = floorToTenMinutes(new Date()).toISOString();

  // Uncomment this during testing when you want every request to bypass bucket dedupe.
  const bucketAt = new Date().toISOString();

  const { inserted, reading } = await ingestRepo.createReadingDeduped10m({
    deviceId: devId,
    bucketAt,
    temperatureC: temp,
    rssiDbm: rssiInt,
  });

  if (inserted && TRIGGER_EXTERNAL_ON_INGEST) {
    try {
      await externalConditionsService.ingestCurrentForDevice({
        deviceId: devId,
      });
    } catch (e) {
      // Do not fail ingest if external weather fetch fails.
      console.error("External condition ingest failed:", e?.message || e);
    }
  }

  return { inserted, reading };
};

function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function badRequest(message) {
  return httpError(400, "VALIDATION_ERROR", message);
}

function requirePositiveIntLike(field, value) {
  const n = requireIntLike(field, value);
  if (n <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
  return n;
}

function requireIntLike(field, value) {
  const str = coerceInputString(field, value);
  if (!/^-?\d+$/.test(str)) {
    throw badRequest(`${field} must be an integer`);
  }

  const n = Number.parseInt(str, 10);
  if (!Number.isSafeInteger(n)) {
    throw badRequest(`${field} is out of range`);
  }

  return n;
}

function requireFloatLike(field, value) {
  const str = coerceInputString(field, value);
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(str)) {
    throw badRequest(`${field} must be numeric`);
  }

  const n = Number(str);
  if (!Number.isFinite(n)) {
    throw badRequest(`${field} is out of range`);
  }

  return n;
}

function coerceInputString(field, value) {
  if (value === null || value === undefined) {
    throw badRequest(`${field} is required`);
  }

  const str = String(value).trim();
  if (!str) {
    throw badRequest(`${field} is required`);
  }

  return str;
}

function floorToTenMinutes(date) {
  const ms = date.getTime();
  return new Date(Math.floor(ms / TEN_MIN_MS) * TEN_MIN_MS);
}
