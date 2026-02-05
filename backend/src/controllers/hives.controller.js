"use strict";

/**
 * Hive Controller
 *
 * Responsibilities:
 * - HTTP concerns only (Express req/res semantics)
 * - Validate incoming request shapes
 * - Call the service layer
 * - Translate service results into HTTP responses
 */

const hiveService = require("../services/hives.service.js");

/**
 * GET /api/hives
 *
 * Returns all hives owned by the authenticated user.
 */
exports.list = async (req, res, next) => {
  try {
    const hives = await hiveService.getHivesForUser({
      beekeeperId: req.user.id,
    });

    return res.status(200).json({ hives });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/hives
 *
 * Body:
 * {
 *   name: string,
 *   notes?: string
 * }
 */
exports.create = async (req, res, next) => {
  try {
    const { name, notes } = req.body ?? {};

    if (!name) {
      return res.status(400).json({
        error: "name is required",
      });
    }

    const hive = await hiveService.createHive({
      beekeeperId: req.user.id,
      name,
      notes: notes ?? null,
    });

    return res.status(201).json({ hive });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/hives/:hiveId
 */
exports.get = async (req, res, next) => {
  try {
    const { hiveId } = req.params;

    const hive = await hiveService.getHiveById({
      hiveId,
      beekeeperId: req.user.id,
    });

    if (!hive) {
      return res.status(404).json({
        error: "Hive not found",
      });
    }

    return res.status(200).json({ hive });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/hives/:hiveId
 *
 * Body:
 * {
 *   name?: string,
 *   notes?: string
 * }
 */
exports.update = async (req, res, next) => {
  try {
    const { hiveId } = req.params;
    const { name, notes } = req.body ?? {};

    if (name === undefined && notes === undefined) {
      return res.status(400).json({
        error: "At least one field must be provided",
      });
    }

    const hive = await hiveService.updateHive({
      hiveId,
      beekeeperId: req.user.id,
      updates: { name, notes },
    });

    if (!hive) {
      return res.status(404).json({
        error: "Hive not found",
      });
    }

    return res.status(200).json({ hive });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/hives/:hiveId
 */
exports.remove = async (req, res, next) => {
  try {
    const { hiveId } = req.params;

    const deleted = await hiveService.deleteHive({
      hiveId,
      beekeeperId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({
        error: "Hive not found",
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};
