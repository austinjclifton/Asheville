"use strict";

/**
 * Devices Service
 *
 * Responsibilities:
 * - Enforce domain invariants
 * - Coordinate repo
 * - Remain HTTP-agnostic
 */

const deviceRepo = require("../db/devices.db.js");

function assertPositiveInt(value, field) {
  if (!Number.isInteger(value) || value <= 0) {
    const err = new Error(`${field} must be a positive integer`);
    err.status = 400;
    throw err;
  }
}

/* -------------------------------------------------------------------------- */

exports.createDevice = async ({ beekeeperId, hiveId, installedAt }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

  return deviceRepo.create({
    beekeeperId,
    hiveId,
    installedAt,
  });
};

/* -------------------------------------------------------------------------- */

exports.listDevices = async ({ beekeeperId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  return deviceRepo.findByBeekeeper(beekeeperId);
};

/* -------------------------------------------------------------------------- */

exports.getDevice = async ({ beekeeperId, deviceId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(deviceId, "deviceId");
  return deviceRepo.findById({ beekeeperId, deviceId });
};

/* -------------------------------------------------------------------------- */

exports.updateDevice = async ({
  beekeeperId,
  deviceId,
  installedAt,
  lastSeenAt,
}) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(deviceId, "deviceId");

  return deviceRepo.update({
    beekeeperId,
    deviceId,
    installedAt,
    lastSeenAt,
  });
};

/* -------------------------------------------------------------------------- */

exports.deleteDevice = async ({ beekeeperId, deviceId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(deviceId, "deviceId");

  return deviceRepo.remove({ beekeeperId, deviceId });
};
