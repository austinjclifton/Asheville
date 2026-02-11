"use strict";

/**
 * Hives Service
 *
 * Domain responsibilities:
 * - enforce invariants (e.g., name length, types)
 * - coordinate repository calls
 * - remain HTTP-agnostic
 *
 * Ownership is enforced by passing beekeeperId to repo queries.
 */

const hiveRepo = require("../db/hives.db.js");

function assertPositiveInt(value, field) {
  if (!Number.isInteger(value) || value <= 0) {
    const err = new Error(`${field} must be a positive integer`);
    err.status = 400;
    throw err;
  }
}

function assertName(name) {
  if (typeof name !== "string" || name.trim().length === 0) {
    const err = new Error("name is required");
    err.status = 400;
    throw err;
  }
  if (name.length > 100) {
    const err = new Error("name cannot exceed 100 characters");
    err.status = 400;
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/* Create                                                                       */
/* -------------------------------------------------------------------------- */

exports.createHive = async ({ beekeeperId, name, notes }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertName(name);

  if (!(notes === null || typeof notes === "string")) {
    const err = new Error("notes must be a string or null");
    err.status = 400;
    throw err;
  }

  return hiveRepo.create({
    beekeeperId,
    name,
    notes,
  });
};

/* -------------------------------------------------------------------------- */
/* Read                                                                          */
/* -------------------------------------------------------------------------- */

exports.listHives = async ({ beekeeperId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  return hiveRepo.findByBeekeeper(beekeeperId);
};

exports.getHive = async ({ beekeeperId, hiveId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");
  return hiveRepo.findById({ beekeeperId, hiveId });
};

/* -------------------------------------------------------------------------- */
/* Update                                                                        */
/* -------------------------------------------------------------------------- */

exports.updateHive = async ({ beekeeperId, hiveId, name, notes }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

  if (name !== undefined) {
    assertName(name);
  }

  if (notes !== undefined && !(notes === null || typeof notes === "string")) {
    const err = new Error("notes must be a string or null");
    err.status = 400;
    throw err;
  }

  // Repo returns null if not found / not owned.
  return hiveRepo.update({
    beekeeperId,
    hiveId,
    name,
    notes,
  });
};

/* -------------------------------------------------------------------------- */
/* Delete                                                                        */
/* -------------------------------------------------------------------------- */

exports.deleteHive = async ({ beekeeperId, hiveId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");
  return hiveRepo.remove({ beekeeperId, hiveId });
};
