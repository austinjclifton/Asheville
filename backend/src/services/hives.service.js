"use strict";

/**
 * Hives Service
 *
 * Responsibilities:
 * - Enforce domain invariants (types, lengths, patch semantics)
 * - Coordinate repository calls
 * - Remain HTTP-agnostic
 *
 * Ownership enforcement is implemented in the repository layer via beekeeper_id scoping.
 */

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
 * Assert a value is a positive integer.
 */
function assertPositiveInt(value, field) {
  if (!Number.isInteger(value) || value <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
}

/**
 * Normalize and validate required hive name.
 */
function normalizeRequiredName(name) {
  if (typeof name !== "string") {
    throw badRequest("name is required");
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw badRequest("name is required");
  }

  if (trimmed.length > 100) {
    throw badRequest("name cannot exceed 100 characters");
  }

  return trimmed;
}

/**
 * Normalize notes field with PATCH semantics.
 * - undefined => not provided
 * - null => clear
 * - string => trimmed string (may be "")
 */
function normalizeNotes(notes) {
  if (notes === undefined) return undefined;
  if (notes === null) return null;

  if (typeof notes !== "string") {
    throw badRequest("notes must be a string or null");
  }

  return notes.trim();
}

/**
 * POST-like: Create a hive for the authenticated beekeeper.
 */
exports.createHive = async ({ beekeeperId, name, notes }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");

  const nameNorm = normalizeRequiredName(name);

  // For create: notes defaults to null when omitted.
  const notesNorm = notes === undefined ? null : normalizeNotes(notes);

  return hiveRepo.create({
    beekeeperId,
    name: nameNorm,
    notes: notesNorm,
  });
};

/**
 * List hives for a beekeeper.
 */
exports.listHives = async ({ beekeeperId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  return hiveRepo.listByBeekeeper({ beekeeperId });
};

/**
 * Get a single hive by id (scoped).
 */
exports.getHive = async ({ beekeeperId, hiveId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

  return hiveRepo.findByIdScoped({ beekeeperId, hiveId });
};

/**
 * Patch hive fields (name and/or notes).
 */
exports.updateHive = async ({ beekeeperId, hiveId, name, notes }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

  // For update: omitted fields stay undefined (PATCH semantics).
  const nameNorm = name === undefined ? undefined : normalizeRequiredName(name);
  const notesNorm = normalizeNotes(notes);

  if (nameNorm === undefined && notesNorm === undefined) {
    throw badRequest("Provide at least one field to update");
  }

  return hiveRepo.updateScoped({
    beekeeperId,
    hiveId,
    name: nameNorm,
    notes: notesNorm,
  });
};

/**
 * Delete a hive by id (scoped).
 */
exports.deleteHive = async ({ beekeeperId, hiveId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

  return hiveRepo.removeScoped({ beekeeperId, hiveId });
};
