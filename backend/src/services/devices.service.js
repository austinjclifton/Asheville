"use strict";

/**
 * Devices Service
 *
 * Responsibilities:
 * - Enforce domain invariants (types, 1:1 hive->device policy)
 * - Normalize inputs (timestamps)
 * - Coordinate repository calls (scoped by beekeeper)
 *
 * Notes:
 * - Ownership is enforced via scoped repo methods (beekeeperId)
 * - Under 1:1, a hive has 0 or 1 device
 */

const deviceRepo = require("../db/devices.db.js");
const hiveRepo = require("../db/hives.db.js");

/**
 * Create a 400 error for invalid inputs.
 */
function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

/**
 * Create a 409 error for domain conflicts.
 */
function conflict(message) {
  const err = new Error(message);
  err.status = 409;
  return err;
}

/**
 * Assert a value is a positive integer.
 */
function assertPositiveInt(value, field) {
  if (!Number.isInteger(value) || value <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
}

/**
 * Normalize an optional timestamp to ISO.
 * - undefined => not provided (PATCH semantics)
 * - null => explicitly clear
 * - string/Date => ISO string
 */
function normalizeOptionalIso(value, field) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw badRequest(`${field} must be a valid ISO8601 timestamp`);
  }

  return d.toISOString();
}

/**
 * Detect Postgres unique constraint violations (SQLSTATE 23505).
 */
function isPgUniqueViolation(err) {
  return err && err.code === "23505";
}

/**
 * Ensure a hive exists and is owned by the beekeeper.
 * Returns true/false (no throws for not-found).
 */
async function hiveExistsScoped({ beekeeperId, hiveId }) {
  return hiveRepo.existsScoped({ beekeeperId, hiveId });
}

/**
 * Enforce 1:1 hive->device policy with a fast existence check.
 * Uses listByHiveScoped for compatibility with current repo surface.
 */
async function assertHiveHasNoDevice({ beekeeperId, hiveId }) {
  const existing = await deviceRepo.listByHiveScoped({ beekeeperId, hiveId });
  if (existing && existing.length > 0) {
    throw conflict("This hive already has a device");
  }
}

/**
 * Create a device under a hive (scoped). Returns null if hive not found/not owned.
 */
exports.createDevice = async ({ beekeeperId, hiveId, installedAt }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

  const hiveExists = await hiveExistsScoped({ beekeeperId, hiveId });
  if (!hiveExists) return null;

  await assertHiveHasNoDevice({ beekeeperId, hiveId });

  const installedIso = normalizeOptionalIso(installedAt, "installedAt");

  try {
    return await deviceRepo.createScoped({
      beekeeperId,
      hiveId,
      installedAt: installedIso,
    });
  } catch (err) {
    if (isPgUniqueViolation(err)) {
      throw conflict("This hive already has a device");
    }
    throw err;
  }
};

/**
 * List all devices for the authenticated beekeeper.
 */
exports.listDevices = async ({ beekeeperId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  return deviceRepo.listByBeekeeper({ beekeeperId });
};

/**
 * List devices for a given hive.
 * Returns null when hive does not exist or is not owned.
 */
exports.listDevicesForHive = async ({ beekeeperId, hiveId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

  const hiveExists = await hiveExistsScoped({ beekeeperId, hiveId });
  if (!hiveExists) return null;

  return deviceRepo.listByHiveScoped({ beekeeperId, hiveId });
};

/**
 * Get a device by id (scoped). Returns null if not found/not owned.
 */
exports.getDevice = async ({ beekeeperId, deviceId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(deviceId, "deviceId");

  return deviceRepo.findByIdScoped({ beekeeperId, deviceId });
};

/**
 * Update device fields (scoped). Returns null if not found/not owned.
 */
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

  // Enforce PATCH semantics at the service boundary.
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
 * Touch lastSeenAt for a device (scoped). If seenAt is omitted, repo can default to now().
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

/**
 * Delete a device (scoped). Returns boolean from repo.
 */
exports.deleteDevice = async ({ beekeeperId, deviceId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(deviceId, "deviceId");

  return deviceRepo.removeScoped({ beekeeperId, deviceId });
};
