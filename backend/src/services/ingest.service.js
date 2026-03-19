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
  if (temperature <= TEMP_MIN || temperature >= TEMP_MAX) {
    throw badRequest(`temperature must be between ${TEMP_MIN} and ${TEMP_MAX}`);
  }

  if (rssi < RSSI_MIN || rssi > RSSI_MAX) {
    throw badRequest(`rssi must be between ${RSSI_MIN} and ${RSSI_MAX}`);
  }

  // *** use this for real 10-minute dedupe behavior
  //const bucketAt = floorToTenMinutes(new Date()).toISOString();

  // *** uncomment this during testing when you want every request to bypass bucket dedupe
  const bucketAt = new Date().toISOString();

  //insert at the repo level
  const { inserted, reading } = await ingestRepo.createReadingDeduped10m({
    deviceId: deviceId,
    bucketAt,
    temperatureC: temperature,
    rssiDbm: rssi,
  });

  //if ingest is successful, trigger external conditions ingest for this device
  if (inserted && TRIGGER_EXTERNAL_ON_INGEST) {
    try {
      await externalConditionsService.fetchCurrentForDevice({
        deviceId: deviceId,
      });
    } catch (e) {
      console.error("External condition ingest failed:", e?.message || e);
    }
  }

  return { inserted, reading };
};

//error handling helpers
function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function badRequest(message) {
  return httpError(400, "VALIDATION_ERROR", message);
}

//helper to floor a date to the nearest 10-minute mark, used in prod
function floorToTenMinutes(date) {
  const ms = date.getTime();
  return new Date(Math.floor(ms / TEN_MIN_MS) * TEN_MIN_MS);
}
