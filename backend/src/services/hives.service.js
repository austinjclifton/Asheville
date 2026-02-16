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
 * normalizeNotes
 *
 * Semantics:
 * - undefined => not provided (PATCH)
 * - null => clear
 * - string => trimmed string (may become "" if user sends whitespace only)
 *
 * If you want whitespace-only notes to clear instead, swap "" -> null below.
 */
function normalizeNotes(notes) {
  if (notes === undefined) return undefined;
  if (notes === null) return null;

  if (typeof notes !== "string") {
    throw badRequest("notes must be a string or null");
  }

  const trimmed = notes.trim();
  return trimmed;
}

/* ========================================================================== */
/* Create                                                                      */
/* ========================================================================== */

exports.createHive = async ({ beekeeperId, name, notes }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");

  const nameNorm = normalizeRequiredName(name);
  const notesNorm = notes === undefined ? null : normalizeNotes(notes);

  return hiveRepo.create({
    beekeeperId,
    name: nameNorm,
    notes: notesNorm,
  });
};

/* ========================================================================== */
/* Read                                                                        */
/* ========================================================================== */

exports.listHives = async ({ beekeeperId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  return hiveRepo.listByBeekeeper({ beekeeperId });
};

exports.getHive = async ({ beekeeperId, hiveId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");
  return hiveRepo.findByIdScoped({ beekeeperId, hiveId });
};

/* ========================================================================== */
/* Update                                                                      */
/* ========================================================================== */

exports.updateHive = async ({ beekeeperId, hiveId, name, notes }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");

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

/* ========================================================================== */
/* Delete                                                                      */
/* ========================================================================== */

exports.deleteHive = async ({ beekeeperId, hiveId }) => {
  assertPositiveInt(beekeeperId, "beekeeperId");
  assertPositiveInt(hiveId, "hiveId");
  return hiveRepo.removeScoped({ beekeeperId, hiveId });
};
