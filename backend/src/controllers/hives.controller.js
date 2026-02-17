"use strict";

/**
 * Hives Controller
 *
 * Responsibilities:
 * - HTTP boundary only (Express req/res)
 * - Minimal parsing/normalization (ids + presence)
 * - Delegate domain validation + patch semantics to service
 * - Use next(err) consistently
 */

const hiveService = require("../services/hives.service.js");

/* ========================================================================== */
/* Helpers                                                                     */
/* ========================================================================== */

function safeBody(req) {
  return req.body ?? {};
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function parsePositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`${field} must be a positive integer`);
  }
  return n;
}

function beekeeperIdFromReq(req) {
  const id = Number(req.user?.id);
  if (!Number.isInteger(id) || id <= 0) {
    // Should be impossible if requireAuth is correct; fail closed.
    throw badRequest("Invalid authenticated user");
  }
  return id;
}

/* ========================================================================== */
/* Handlers                                                                    */
/* ========================================================================== */

/**
 * POST /api/hives
 * Create a hive for the authenticated beekeeper.
 */
exports.create = async (req, res, next) => {
  try {
    const body = safeBody(req);

    // Minimal boundary check; service owns full validation.
    if (body.name === undefined) {
      throw badRequest("name is required");
    }

    const hive = await hiveService.createHive({
      beekeeperId: beekeeperIdFromReq(req),
      name: body.name,
      notes: body.notes, // may be undefined/null/string; service handles semantics
    });

    return res.status(201).json({ hive });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/hives
 * List hives for the authenticated beekeeper.
 */
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

/**
 * GET /api/hives/:id
 * Get a single hive by id (scoped).
 */
exports.getById = async (req, res, next) => {
  try {
    const hive = await hiveService.getHive({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: parsePositiveInt(req.params.id, "id"),
    });

    if (!hive) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(200).json({ hive });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/hives/:id
 * Patch hive fields (name and/or notes).
 */
exports.update = async (req, res, next) => {
  try {
    const body = safeBody(req);

    const hive = await hiveService.updateHive({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: parsePositiveInt(req.params.id, "id"),
      name: body.name, // undefined => not provided
      notes: body.notes, // undefined => not provided, null => clear, string => set
    });

    if (!hive) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(200).json({ hive });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/hives/:id
 * Delete a hive (scoped).
 */
exports.remove = async (req, res, next) => {
  try {
    const deleted = await hiveService.deleteHive({
      beekeeperId: beekeeperIdFromReq(req),
      hiveId: parsePositiveInt(req.params.id, "id"),
    });

    if (!deleted) {
      return res.status(404).json({ error: "Hive not found" });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
