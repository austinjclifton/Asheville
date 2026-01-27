const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const readingService = require("../services/reading.service.js");

const router = express.Router();

/**
 * GET /readings
 *
 * Query params:
 * - deviceId?: number
 * - hiveId?: number
 * - from?: ISO8601 timestamp
 * - to?: ISO8601 timestamp
 * - limit?: number (default handled by service)
 *
 * Behavior:
 * - Returns readings owned by the authenticated user
 * - Filtered by device or hive if provided
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { deviceId, hiveId, from, to, limit } = req.query ?? {};

    if (deviceId && hiveId) {
      return res.status(400).json({
        error: "Specify either deviceId or hiveId, not both",
      });
    }

    const readings = await readingService.getReadingsForUser({
      beekeeperId: req.user.id,
      deviceId: deviceId ? Number(deviceId) : undefined,
      hiveId: hiveId ? Number(hiveId) : undefined,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({ readings });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /readings/latest
 *
 * Query params:
 * - deviceId?: number
 * - hiveId?: number
 *
 * Behavior:
 * - Returns the most recent reading
 * - Scoped to device or hive
 */
router.get("/latest", requireAuth, async (req, res, next) => {
  try {
    const { deviceId, hiveId } = req.query ?? {};

    if (!deviceId && !hiveId) {
      return res.status(400).json({
        error: "deviceId or hiveId is required",
      });
    }

    if (deviceId && hiveId) {
      return res.status(400).json({
        error: "Specify either deviceId or hiveId, not both",
      });
    }

    const reading = await readingService.getLatestReadingForUser({
      beekeeperId: req.user.id,
      deviceId: deviceId ? Number(deviceId) : undefined,
      hiveId: hiveId ? Number(hiveId) : undefined,
    });

    if (!reading) {
      return res.status(404).json({
        error: "No readings found",
      });
    }

    res.status(200).json({ reading });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /devices/:deviceId/readings
 *
 * Query params:
 * - from?: ISO8601 timestamp
 * - to?: ISO8601 timestamp
 * - limit?: number
 *
 * Behavior:
 * - Returns readings for a single device
 */
router.get(
  "/devices/:deviceId/readings",
  requireAuth,
  async (req, res, next) => {
    try {
      const { deviceId } = req.params;
      const { from, to, limit } = req.query ?? {};

      const readings = await readingService.getReadingsForUser({
        beekeeperId: req.user.id,
        deviceId: Number(deviceId),
        from,
        to,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({ readings });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /hives/:hiveId/readings
 *
 * Query params:
 * - from?: ISO8601 timestamp
 * - to?: ISO8601 timestamp
 * - limit?: number
 *
 * Behavior:
 * - Returns readings across all devices in a hive
 */
router.get("/hives/:hiveId/readings", requireAuth, async (req, res, next) => {
  try {
    const { hiveId } = req.params;
    const { from, to, limit } = req.query ?? {};

    const readings = await readingService.getReadingsForUser({
      beekeeperId: req.user.id,
      hiveId: Number(hiveId),
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json({ readings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
