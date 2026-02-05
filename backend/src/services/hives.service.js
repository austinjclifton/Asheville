"use strict";

/**
 * Hive Service (MVP)
 *
 * Responsibilities:
 * - Own hive-related business rules
 * - Enforce beekeeper ownership
 * - Stay HTTP-agnostic
 *
 * This file intentionally:
 * - Contains ONLY exported service functions
 * - Does NOT contain SQL
 * - Does NOT know about Express
 *
 * DB/repository logic will be injected later.
 */

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * createHive
 *
 * Creates a new hive for a beekeeper.
 */
exports.createHive = async ({ beekeeperId, name, notes }) => {
  if (!beekeeperId) {
    throw new Error("beekeeperId is required");
  }

  if (!name) {
    throw new Error("Hive name is required");
  }

  const hive = {
    id: null, // placeholder
    beekeeperId,
    name,
    notes: notes ?? null,
    createdAt: new Date(),
  };

  // TODO (DB layer):
  // - insert hive
  // - enforce beekeeper ownership

  return hive;
};

/**
 * getHivesForUser
 *
 * Returns all hives owned by a beekeeper.
 */
exports.getHivesForUser = async ({ beekeeperId }) => {
  if (!beekeeperId) {
    throw new Error("beekeeperId is required");
  }

  // TODO (DB layer):
  // - fetch hives by beekeeperId

  return [];
};

/**
 * getHiveForUser
 *
 * Returns a single hive if owned by the beekeeper.
 */
exports.getHiveForUser = async ({ beekeeperId, hiveId }) => {
  if (!beekeeperId) {
    throw new Error("beekeeperId is required");
  }

  if (!hiveId) {
    throw new Error("hiveId is required");
  }

  // TODO (DB layer):
  // - fetch hive
  // - verify ownership

  return null;
};

/**
 * deleteHiveForUser
 *
 * Deletes a hive owned by the beekeeper.
 * Devices and readings cascade at the DB layer.
 */
exports.deleteHiveForUser = async ({ beekeeperId, hiveId }) => {
  if (!beekeeperId) {
    throw new Error("beekeeperId is required");
  }

  if (!hiveId) {
    throw new Error("hiveId is required");
  }

  // TODO (DB layer):
  // - verify ownership
  // - delete hive

  return true;
};
