"use strict";

/**
 * Hives Controller
 *
 * Responsibilities:
 * - Validate HTTP input
 * - Call service layer
 * - Return correct HTTP codes
 */

const hiveService = require("../services/hives.service.js");

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function parsePositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: `${field} must be a positive integer` };
  }
  return { ok: true, value: n };
}

function parseOptionalString(value, field, { maxLen } = {}) {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null) return { ok: false, error: `${field} cannot be null` };

  if (typeof value !== "string") {
    return { ok: false, error: `${field} must be a string` };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: `${field} cannot be empty` };
  }

  if (maxLen && trimmed.length > maxLen) {
    return { ok: false, error: `${field} must be at most ${maxLen} chars` };
  }

  return { ok: true, value: trimmed };
}

function parseOptionalTextNullable(value, field, { maxLen } = {}) {
  // undefined => not provided (PATCH semantics)
  if (value === undefined) return { ok: true, value: undefined };

  // null => explicitly clear
  if (value === null) return { ok: true, value: null };

  if (typeof value !== "string") {
    return { ok: false, error: `${field} must be a string or null` };
  }

  const trimmed = value.trim();

  // allow empty string? I recommend: treat "" as empty notes (store "")
  // but most APIs prefer trimming to "" => null. We'll keep explicit:
  if (maxLen && trimmed.length > maxLen) {
    return { ok: false, error: `${field} must be at most ${maxLen} chars` };
  }

  return { ok: true, value: trimmed };
}

function beekeeperIdFromReq(req) {
  return Number(req.user.id);
}

/* -------------------------------------------------------------------------- */
/* POST /api/hives                                                             */
/* Body: { name, notes? }                                                      */
/* -------------------------------------------------------------------------- */

exports.create = async (req, res, next) => {
  try {
    const { name, notes } = req.body ?? {};

    const nameParsed = parseOptionalString(name, "name", { maxLen: 100 });
    if (!nameParsed.ok || nameParsed.value === undefined) {
      return res.status(400).json({ error: nameParsed.ok ? "name is required" : nameParsed.error });
    }

    const notesParsed = parseOptionalTextNullable(notes, "notes");
    if (!notesParsed.ok) {
      return res.status(400).json({ error: notesParsed.error });
    }

    const hive = await hiveService.createHive({
      beekeeperId: beekeeperIdFromReq(req),
      name: nameParsed.value,
      notes: notesParsed.value ?? null,
    });

    return res.status(201).json({ hive });
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/hives                                                              */
/* -------------------------------------------------------------------------- */

exports.list = async (req, res, next) => {
  try {
    const hives = await hiveService.listHives({
      beekeeperId: beekeeperIdFromReq(req),
    });

    return res.status(200).json({ hives });
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* GET /api/hives/:id                                                          */
/* -------------------------------------------------------------------------- */

exports.getById = async (req, res, next) => {
  try {
    const idParsed = parsePositiveInt(req.params.id, "id");
    if (!idParsed.ok) {
      return res.status(400).json({ error: idParsed.error });
    }

    const hive = await hiveService.getHive({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: idParsed.value,
    });

    if (!hive) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(200).json({ hive });
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* PATCH /api/hives/:id                                                        */
/* Body: { name?, notes? }                                                     */
/* -------------------------------------------------------------------------- */

exports.update = async (req, res, next) => {
  try {
    const idParsed = parsePositiveInt(req.params.id, "id");
    if (!idParsed.ok) {
      return res.status(400).json({ error: idParsed.error });
    }

    const { name, notes } = req.body ?? {};

    const nameParsed = parseOptionalString(name, "name", { maxLen: 100 });
    if (!nameParsed.ok) {
      return res.status(400).json({ error: nameParsed.error });
    }

    const notesParsed = parseOptionalTextNullable(notes, "notes");
    if (!notesParsed.ok) {
      return res.status(400).json({ error: notesParsed.error });
    }

    if (nameParsed.value === undefined && notesParsed.value === undefined) {
      return res.status(400).json({ error: "Provide at least one field to update" });
    }

    const hive = await hiveService.updateHive({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: idParsed.value,
      name: nameParsed.value,
      notes: notesParsed.value,
    });

    if (!hive) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(200).json({ hive });
  } catch (err) {
    return next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* DELETE /api/hives/:id                                                       */
/* -------------------------------------------------------------------------- */

exports.remove = async (req, res, next) => {
  try {
    const idParsed = parsePositiveInt(req.params.id, "id");
    if (!idParsed.ok) {
      return res.status(400).json({ error: idParsed.error });
    }

    const deleted = await hiveService.deleteHive({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: idParsed.value,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
