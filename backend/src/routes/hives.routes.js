const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const hiveService = require("../services/hive.service.js");

const router = express.Router();

/**
 * GET /hives
 *
 * Behavior:
 * - Returns all hives owned by the authenticated user
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const hives = await hiveService.getHivesForUser(req.user.id);
    res.status(200).json({ hives });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /hives
 *
 * Body:
 * {
 *   name: string,
 *   notes?: string
 * }
 *
 * Behavior:
 * - Creates a new hive owned by the authenticated user
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { name, notes } = req.body ?? {};

    if (!name) {
      return res.status(400).json({
        error: "Hive name is required",
      });
    }

    const hive = await hiveService.createHive({
      beekeeperId: req.user.id,
      name,
      notes: notes ?? null,
    });

    res.status(201).json({ hive });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /hives/:hiveId
 *
 * Behavior:
 * - Returns a single hive if owned by the user
 */
router.get("/:hiveId", requireAuth, async (req, res, next) => {
  try {
    const { hiveId } = req.params;

    const hive = await hiveService.getHiveById(hiveId, req.user.id);

    if (!hive) {
      return res.status(404).json({
        error: "Hive not found",
      });
    }

    res.status(200).json({ hive });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /hives/:hiveId
 *
 * Body:
 * {
 *   name?: string,
 *   notes?: string
 * }
 *
 * Behavior:
 * - Updates hive metadata
 */
router.put("/:hiveId", requireAuth, async (req, res, next) => {
  try {
    const { hiveId } = req.params;
    const { name, notes } = req.body ?? {};

    if (name === undefined && notes === undefined) {
      return res.status(400).json({
        error: "At least one field must be provided",
      });
    }

    const updated = await hiveService.updateHive(hiveId, req.user.id, {
      name,
      notes,
    });

    if (!updated) {
      return res.status(404).json({
        error: "Hive not found",
      });
    }

    res.status(200).json({ hive: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /hives/:hiveId
 *
 * Behavior:
 * - Deletes a hive owned by the user
 */
router.delete("/:hiveId", requireAuth, async (req, res, next) => {
  try {
    const { hiveId } = req.params;

    const deleted = await hiveService.deleteHive(hiveId, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Hive not found",
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
