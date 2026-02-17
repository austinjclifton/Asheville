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

/* ========================================================================== */
/* Errors + Validation                                                         */
/* ========================================================================== */

const HIVE_NAME_MAX = 100;
// optional: keep notes unlimited (TEXT), or enforce a sane limit
// const HIVE_NOTES_MAX = 2000;

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

/**
 * For CREATE: name required.
 */
function normalizeRequiredName(name) {
  if (typeof name !== "string") {
    throw badRequest("name is required");
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw badRequest("name is required");
  }

  if (trimmed.length > HIVE_NAME_MAX) {
    throw badRequest(`name cannot exceed ${HIVE_NAME_MAX} characters`);
  }

  return trimmed;
}

/**
 * For PATCH: name optional.
 * - undefined => not provided
 * - rejects null, non-string, empty string
 */
function normalizeNameForPatch(name) {
  if (name === undefined) return undefined;

  if (name === null) {
    throw badRequest("name cannot be null");
  }

  if (typeof name !== "string") {
    throw badRequest("name must be a string");
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw badRequest("name cannot be empty");
  }

  if (trimmed.length > HIVE_NAME_MAX) {
    throw badRequest(`name cannot exceed ${HIVE_NAME_MAX} characters`);
  }

  return trimmed;
}

/**
 * Notes patch semantics:
 * - undefined => not provided
 * - null => clear
 * - string => trimmed (may be "")
 */
function normalizeNotesForPatch(notes) {
  if (notes === undefined) return undefined;
  if (notes === null) return null;

  if (typeof notes !== "string") {
    throw badRequest("notes must be a string or null");
  }

  const trimmed = notes.trim();

  // optional:
  // if (trimmed.length > HIVE_NOTES_MAX) {
  //   throw badRequest(`notes cannot exceed ${HIVE_NOTES_MAX} characters`);
  // }

  return trimmed;
}

/**
 * Notes create semantics:
 * - undefined => store null
 * - null => store null
 * - string => trimmed
 */
function normalizeNotesForCreate(notes) {
  if (notes === undefined || notes === null) return null;
  return normalizeNotesForPatch(notes); // handles string validation/trim
}

/* ========================================================================== */
/* Public API                                                                  */
/* ========================================================================== */

/**
 * Create a hive for the authenticated beekeeper.
 */
exports.createHive = async ({ beekeeperId, name, notes }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");

  const nameNorm = normalizeRequiredName(name);
  const notesNorm = normalizeNotesForCreate(notes);

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

  const nameNorm = normalizeNameForPatch(name);
  const notesNorm = normalizeNotesForPatch(notes);

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
