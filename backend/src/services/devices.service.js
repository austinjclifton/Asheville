"use strict";

/**
 * Devices Service
 *
 * Responsibilities:
 * - Enforce domain invariants (inputs, patch semantics)
 * - Coordinate repositories
 * - Remain HTTP-agnostic (no req/res)
 *
 * Notes:
 * - Ownership is enforced in the repository via device → hive → beekeeper join.
 * - For nested hive routes, listDevicesForHive returns:
 *   - device[] when hive is owned (even if empty)
 *   - null when hive is not found / not owned (controller returns 404)
 */

const deviceRepo = require("../db/devices.db.js");
const hiveRepo = require("../db/hives.db.js");

/* ========================================================================== */
/* Validation Helpers                                                          */
/* ========================================================================== */

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
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

/* ========================================================================== */
/* Create                                                                      */
/* ========================================================================== */

exports.createDevice = async ({ beekeeperId, hiveId, installedAt }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

  const installedIso = normalizeOptionalIso(installedAt ?? null, "installedAt");

  // Repo returns null when hive not found / not owned.
  return deviceRepo.createScoped({
    beekeeperId,
    hiveId,
    installedAt: installedIso,
  });
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
