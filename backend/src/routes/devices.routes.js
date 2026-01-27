const express = require("express");
const { requireAuth } = require("../middleware/requireAuth.js");
const deviceService = require("../services/device.service.js");

const router = express.Router();

/**
 * GET /devices
 *
 * Behavior:
 * - Returns all devices belonging to hives owned by the user
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const devices = await deviceService.getDevicesForUser(req.user.id);
    res.status(200).json({ devices });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /devices
 *
 * Body:
 * {
 *   hiveId: number
 * }
 *
 * Behavior:
 * - Creates a new device attached to a hive
 * - installed_at is set by the service
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { hiveId } = req.body ?? {};

    if (!hiveId) {
      return res.status(400).json({
        error: "hiveId is required",
      });
    }

    const device = await deviceService.createDevice({
      hiveId,
      beekeeperId: req.user.id,
    });

    if (!device) {
      return res.status(404).json({
        error: "Hive not found",
      });
    }

    res.status(201).json({ device });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /devices/:deviceId
 *
 * Behavior:
 * - Returns a device if it belongs to the authenticated user
 */
router.get("/:deviceId", requireAuth, async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const device = await deviceService.getDeviceById(deviceId, req.user.id);

    if (!device) {
      return res.status(404).json({
        error: "Device not found",
      });
    }

    res.status(200).json({ device });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /devices/:deviceId
 *
 * Body:
 * {
 *   active?: boolean
 * }
 *
 * Behavior:
 * - Allows enabling/disabling a device
 * - Does NOT allow changing hive_id or timestamps
 */
router.put("/:deviceId", requireAuth, async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { active } = req.body ?? {};

    if (active === undefined) {
      return res.status(400).json({
        error: "active flag is required",
      });
    }

    const updated = await deviceService.updateDevice(deviceId, req.user.id, {
      active,
    });

    if (!updated) {
      return res.status(404).json({
        error: "Device not found",
      });
    }

    res.status(200).json({ device: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /devices/:deviceId
 *
 * Behavior:
 * - Deletes a device owned by the user
 * - Readings cascade via FK
 */
router.delete("/:deviceId", requireAuth, async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const deleted = await deviceService.deleteDevice(deviceId, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Device not found",
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
