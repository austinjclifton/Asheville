"use strict";

/**
 * Hives Controller
 *
 * HTTP-layer responsibilities only:
 * - parse params/query/body
 * - validate request shape (types/ranges)
 * - call service functions
 * - map results to HTTP codes
 *
 * It must NOT:
 * - talk to the database
 * - implement ownership logic (service/repo enforce)
 */

const hiveService = require("../services/hives.service.js");

/* -------------------------------------------------------------------------- */
/* Small parsing helpers (controller-level: HTTP input hygiene)               */
/* -------------------------------------------------------------------------- */

function parsePositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: `${field} must be a positive integer` };
  }
  return { ok: true, value: n };
}

function parseOptionalString(value, field, maxLen) {
  if (value === undefined) return { ok: true, value: undefined };

  if (value === null) return { ok: true, value: null }; // allow explicit null for PATCH

  if (typeof value !== "string") {
    return { ok: false, error: `${field} must be a string` };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: `${field} cannot be empty` };
  }

  if (maxLen && trimmed.length > maxLen) {
    return { ok: false, error: `${field} cannot exceed ${maxLen} characters` };
  }

  return { ok: true, value: trimmed };
}

/* -------------------------------------------------------------------------- */
/* POST /api/hives                                                             */
/* -------------------------------------------------------------------------- */

exports.create = async (req, res, next) => {
  try {
    const { name, notes } = req.body ?? {};

    const nameParsed = parseOptionalString(name, "name", 100);
    if (!nameParsed.ok) {
      return res.status(400).json({ error: nameParsed.error });
    }
    if (nameParsed.value === undefined) {
      return res.status(400).json({ error: "name is required" });
    }

    // notes: allow string or null; also allow undefined (not provided)
    let notesValue = null;
    if (notes === undefined) {
      notesValue = null;
    } else if (notes === null) {
      notesValue = null;
    } else if (typeof notes === "string") {
      // For create: treat blank notes as null.
      const t = notes.trim();
      notesValue = t.length ? t : null;
    } else {
      return res.status(400).json({ error: "notes must be a string or null" });
    }

    const hive = await hiveService.createHive({
      beekeeperId: Number(req.user.id),
      name: nameParsed.value,
      notes: notesValue,
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
      beekeeperId: Number(req.user.id),
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
    const parsed = parsePositiveInt(req.params.id, "id");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }

    const hive = await hiveService.getHive({
      beekeeperId: Number(req.user.id),
      hiveId: parsed.value,
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
/* -------------------------------------------------------------------------- */

exports.update = async (req, res, next) => {
  try {
    const idParsed = parsePositiveInt(req.params.id, "id");
    if (!idParsed.ok) {
      return res.status(400).json({ error: idParsed.error });
    }

    const { name, notes } = req.body ?? {};

    // PATCH semantics:
    // - undefined => field not being changed
    // - null => explicitly set to NULL (allowed for notes)
    // - string => update to trimmed string (with validation)

    const nameParsed = parseOptionalString(name, "name", 100);
    if (!nameParsed.ok) {
      return res.status(400).json({ error: nameParsed.error });
    }

    let notesParsed = { ok: true, value: undefined };
    if (notes !== undefined) {
      if (notes === null) {
        notesParsed = { ok: true, value: null };
      } else if (typeof notes === "string") {
        // For PATCH: allow empty string to mean "clear"
        const t = notes.trim();
        notesParsed = { ok: true, value: t.length ? t : null };
      } else {
        notesParsed = { ok: false, error: "notes must be a string or null" };
      }
    }
    if (!notesParsed.ok) {
      return res.status(400).json({ error: notesParsed.error });
    }

    if (nameParsed.value === undefined && notesParsed.value === undefined) {
      return res.status(400).json({
        error: "Provide at least one field to update: name or notes",
      });
    }

    const hive = await hiveService.updateHive({
      beekeeperId: Number(req.user.id),
      hiveId: idParsed.value,
      name: nameParsed.value, // undefined => unchanged
      notes: notesParsed.value, // undefined => unchanged, null => clear
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
    const parsed = parsePositiveInt(req.params.id, "id");
    if (!parsed.ok) {
      return res.status(400).json({ error: parsed.error });
    }

    const deleted = await hiveService.deleteHive({
      beekeeperId: Number(req.user.id),
      hiveId: parsed.value,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
