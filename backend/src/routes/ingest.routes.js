const express = require("express");
const ingestService = require("../services/readings.service.js");

const router = express.Router();

/**
 * POST /ingest/reading
 *
 * EXTERNAL API
 * ------------
 * This endpoint is called by external hardware / gateways.
 * It is NOT used by the frontend.
 *
 * Authentication:
 * - Requires X-INGEST-KEY header
 *
 * Body:
 * {
 *   deviceId: number,
 *   recordedAt: ISO8601 string,
 *   temperatureC: number,
 *   batteryVoltage?: number,
 *   signalStrength?: number
 * }
 *
 * Behavior:
 * - Validates ingest secret
 * - Validates payload strictly
 * - Inserts reading
 * - Updates device.last_seen_at
 *
 * Failure is explicit and loud.
 */

//device_id, temperature_c, -> recorded_at which is now()

router.post("/reading", async (req, res, next) => {
  try {
    /* ============================================================
     * 1. AUTHENTICATION (INGEST SECRET)
     * ============================================================
     */
    const ingestKey = req.get("X-INGEST-KEY");

    if (!ingestKey || ingestKey !== process.env.INGEST_SECRET) {
      return res.status(401).json({
        error: "Unauthorized ingest request",
      });
    }

    /* ============================================================
     * 2. PAYLOAD EXTRACTION
     * ============================================================
     */
    const {
      deviceId,
      recordedAt,
      temperatureC,
      batteryVoltage,
      signalStrength,
    } = req.body ?? {};

    /* ============================================================
     * 3. VALIDATION (STRICT BY DESIGN)
     * ============================================================
     */

    if (
      deviceId === undefined ||
      recordedAt === undefined ||
      temperatureC === undefined
    ) {
      return res.status(400).json({
        error: "deviceId, recordedAt, and temperatureC are required",
      });
    }

    if (typeof deviceId !== "number") {
      return res.status(400).json({
        error: "deviceId must be a number",
      });
    }

    const recordedDate = new Date(recordedAt);
    if (Number.isNaN(recordedDate.getTime())) {
      return res.status(400).json({
        error: "recordedAt must be a valid ISO8601 timestamp",
      });
    }

    if (typeof temperatureC !== "number") {
      return res.status(400).json({
        error: "temperatureC must be a number",
      });
    }

    if (batteryVoltage !== undefined && typeof batteryVoltage !== "number") {
      return res.status(400).json({
        error: "batteryVoltage must be a number if provided",
      });
    }

    if (signalStrength !== undefined && typeof signalStrength !== "number") {
      return res.status(400).json({
        error: "signalStrength must be a number if provided",
      });
    }

    /* ============================================================
     * 4. INGEST OPERATION
     * ============================================================
     *
     * The service is responsible for:
     * - Ensuring device exists
     * - Ensuring device is active
     * - Inserting into `reading`
     * - Updating `device.last_seen_at`
     * - Handling duplicate (device_id, recorded_at)
     */
    const result = await ingestService.ingestReading({
      deviceId,
      recordedAt: recordedDate,
      temperatureC,
      batteryVoltage: batteryVoltage ?? null,
      signalStrength: signalStrength ?? null,
    });

    if (!result) {
      return res.status(404).json({
        error: "Device not found or inactive",
      });
    }

    /* ============================================================
     * 5. SUCCESS RESPONSE
     * ============================================================
     *
     * We intentionally return minimal data.
     * The sender does not need DB IDs or echoes.
     */
    res.status(201).json({
      success: true,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
