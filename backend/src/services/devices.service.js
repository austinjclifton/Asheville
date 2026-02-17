"use strict";

/**
 * device service
 *
 * Function Index:
 * - createDevice({ beekeeperId, hiveId, installedAt? }) -> device | null
 * - listDevices({ beekeeperId }) -> device[]
 * - listDevicesForHive({ beekeeperId, hiveId }) -> device[] | null     (null => hive not found / not owned)
 * - getDevice({ beekeeperId, deviceId }) -> device | null
 * - updateDevice({ beekeeperId, deviceId, installedAt?, lastSeenAt? }) -> device | null
 * - touchLastSeen({ beekeeperId, deviceId, seenAt? }) -> device | null
 * - deleteDevice({ beekeeperId, deviceId }) -> boolean
 */

const deviceRepo = require("../db/devices.db.js");
const hiveRepo = require("../db/hives.db.js");

/* ========================================================================== */
/* Errors + Validation Helpers                                                 */
/* ========================================================================== */

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function conflict(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

function assertPositiveInt(value, field) {
  if (!Number.isInteger(value) || value <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
}

function normalizeOptionalIso(value, field) {
  // undefined => "not provided" (PATCH semantics)
  if (value === undefined) return undefined;

  // null => explicitly clear
  if (value === null) return null;

  // accept Date or string
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw badRequest(`${field} must be a valid ISO8601 timestamp`);
  }

  return d.toISOString();
}

function isPgUniqueViolation(err) {
  // node-postgres uses err.code for SQLSTATE
  return err && err.code === "23505";
}

/* ========================================================================== */
/* Create                                                                      */
/* ========================================================================== */

exports.createDevice = async ({ beekeeperId, hiveId, installedAt }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

  // Ensure hive exists and is owned (keeps behavior consistent with listDevicesForHive)
  const hiveExists = await hiveRepo.existsScoped({ beekeeperId, hiveId });
  if (!hiveExists) return null;

  // 1:1 enforcement (friendly error before DB constraint)
  // Keep compatibility with current repo shape (list returns array).
  const existing = await deviceRepo.listByHiveScoped({ beekeeperId, hiveId });
  if (existing && existing.length > 0) {
    throw conflict("This hive already has a device");
  }

  const installedIso = normalizeOptionalIso(installedAt ?? null, "installedAt");

  try {
    return await deviceRepo.createScoped({
      beekeeperId,
      hiveId,
      installedAt: installedIso,
    });
  } catch (err) {
    // Race-safe: if two creates happen simultaneously, DB UNIQUE(device.hive_id) wins.
    if (isPgUniqueViolation(err)) {
      throw conflict("This hive already has a device");
    }
    throw err;
  }
};

/* ========================================================================== */
/* Read                                                                        */
/* ========================================================================== */

exports.listDevices = async ({ beekeeperId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  return deviceRepo.listByBeekeeper({ beekeeperId });
};

/**
 * listDevicesForHive
 *
 * Returns:
 * - device[] when hive exists and is owned (may be empty)
 * - null when hive does not exist or is not owned
 *
 * Note: Under 1:1, array will be [] or [device].
 */
exports.listDevicesForHive = async ({ beekeeperId, hiveId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

  const hiveExists = await hiveRepo.existsScoped({ beekeeperId, hiveId });
  if (!hiveExists) return null;

  return deviceRepo.listByHiveScoped({ beekeeperId, hiveId });
};

exports.getDevice = async ({ beekeeperId, deviceId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(deviceId, "deviceId");
  return deviceRepo.findByIdScoped({ beekeeperId, deviceId });
};

/* ========================================================================== */
/* Update                                                                      */
/* ========================================================================== */

exports.updateDevice = async ({
  beekeeperId,
  deviceId,
  installedAt,
  lastSeenAt,
}) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(deviceId, "deviceId");

  const installedIso = normalizeOptionalIso(installedAt, "installedAt");
  const lastSeenIso = normalizeOptionalIso(lastSeenAt, "lastSeenAt");

  if (installedIso === undefined && lastSeenIso === undefined) {
    throw badRequest("Provide at least one field to update");
  }

  return deviceRepo.updateScoped({
    beekeeperId,
    deviceId,
    installedAt: installedIso,
    lastSeenAt: lastSeenIso,
  });
};

/**
 * touchLastSeen
 *
 * Convenience for “device ping / ingest” flows.
 * If seenAt omitted, uses now() in repo.
 */
exports.touchLastSeen = async ({ beekeeperId, deviceId, seenAt }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(deviceId, "deviceId");

  const seenIso = normalizeOptionalIso(seenAt, "seenAt");

  return deviceRepo.touchLastSeenScoped({
    beekeeperId,
    deviceId,
    seenAt: seenIso,
  });
};

/* ========================================================================== */
/* Delete                                                                      */
/* ========================================================================== */

exports.deleteDevice = async ({ beekeeperId, deviceId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(deviceId, "deviceId");

  return deviceRepo.removeScoped({ beekeeperId, deviceId });
};
