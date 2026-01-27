"use strict";

/**
 * Device Service (MVP)
 *
 * Responsibilities:
 * - Own device-related business logic
 * - Enforce ownership via hive → beekeeper relationship
 * - Stay HTTP-agnostic
 *
 * This file intentionally:
 * - Contains ONLY exported service functions
 * - Uses minimal inline validation
 * - Avoids premature abstractions
 *
 * DB/repository logic will be injected later.
 */

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

/**
 * No configuration needed for MVP device logic.
 */

/* -------------------------------------------------------------------------- */
/* Utilities (MVP-only, minimal)                                               */
/* -------------------------------------------------------------------------- */

/**
 * No shared helpers required for MVP.
 */

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * getDevicesForUser
 *
 * Returns all devices belonging to hives owned by the beekeeper.
 */
exports.getDevicesForUser = async ({ beekeeperId }) => {
  if (!beekeeperId) {
    throw new Error("beekeeperId is required");
  }

  // TODO (DB layer):
  // - fetch devices joined through hives owned by beekeeperId

  return [];
};

/**
 * createDevice
 *
 * Creates a new device attached to a hive.
 */
exports.createDevice = async ({ hiveId, beekeeperId }) => {
  if (!hiveId || !beekeeperId) {
    throw new Error("hiveId and beekeeperId are required");
  }

  // TODO (DB layer):
  // - verify hive exists and is owned by beekeeperId
  // - insert device
  // - set installed_at
  // - return created device

  return {
    id: null,
    hiveId,
    active: true,
    installedAt: new Date(),
  };
};

/**
 * getDeviceById
 *
 * Returns a device if it belongs to the beekeeper.
 */
exports.getDeviceById = async ({ deviceId, beekeeperId }) => {
  if (!deviceId || !beekeeperId) {
    throw new Error("deviceId and beekeeperId are required");
  }

  // TODO (DB layer):
  // - fetch device by id
  // - verify ownership via hive

  return null;
};

/**
 * updateDevice
 *
 * Updates mutable device fields.
 */
exports.updateDevice = async ({ deviceId, beekeeperId, updates }) => {
  if (!deviceId || !beekeeperId) {
    throw new Error("deviceId and beekeeperId are required");
  }

  if (!updates || updates.active === undefined) {
    throw new Error("active update is required");
  }

  // TODO (DB layer):
  // - verify ownership
  // - update active flag
  // - return updated device

  return null;
};

/**
 * deleteDevice
 *
 * Deletes a device if owned by the beekeeper.
 */
exports.deleteDevice = async ({ deviceId, beekeeperId }) => {
  if (!deviceId || !beekeeperId) {
    throw new Error("deviceId and beekeeperId are required");
  }

  // TODO (DB layer):
  // - verify ownership
  // - delete device
  // - readings cascade via FK

  return false;
};
