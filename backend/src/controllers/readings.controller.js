"use strict";

/**
 * Readings Controller
 *
 * Responsibilities:
 * - HTTP concerns only (Express req/res)
 * - Minimal required-param presence checks
 * - Delegate validation/policy to service layer
 * - Translate service results into HTTP responses
 *
 * Notes:
 * - Read-only (telemetry is immutable)
 * - Ownership is enforced by repo joins; service enforces policy/validation
 * - Timestamp-only API: callers must provide `since` (and optional `until`)
 */

const readingService = require("../services/readings.service.js");

/**
 * Create and throw a 400 validation error for missing/invalid request inputs.
 */
function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.code = "VALIDATION_ERROR";
  throw err;
}

/**
 * Require a query param to be present and non-empty.
 */
function requireQuery(req, name) {
  const value = req.query?.[name];
  if (value === undefined || value === null || value === "") {
    badRequest(`${name} is required`);
  }
  return value;
}

/**
 * Extract authenticated beekeeper id from requireAuth context.
 */
function getBeekeeperId(req) {
  const n = Number(req.user?.id);
  if (!Number.isInteger(n) || n <= 0) {
    badRequest("Invalid beekeeperId");
  }
  return n;
}

/**
 * GET /api/readings/since
 * Return readings for a hive since an ISO timestamp (optional until/limit/order).
 */
exports.since = async (req, res, next) => {
  try {
    const beekeeperId = getBeekeeperId(req);

    // Required query params: presence checks only (service validates/normalizes).
    const hiveId = requireQuery(req, "hiveId");
    const since = requireQuery(req, "since");

    // Optional params: service validates + normalizes.
    const until = req.query.until;
    const limit = req.query.limit;
    const order = req.query.order;

    const readings = await readingService.getHiveReadingsSince({
      beekeeperId,
      hiveId,
      since,
      until,
      limit,
      order,
    });

    return res.status(200).json({ readings });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/readings/latest
 * Return the most recent reading for a hive.
 */
exports.latest = async (req, res, next) => {
  try {
    const beekeeperId = getBeekeeperId(req);

    // Required query param: presence check only (service validates/normalizes).
    const hiveId = requireQuery(req, "hiveId");

    const reading = await readingService.getLatestForHive({
      beekeeperId,
      hiveId,
    });

    if (!reading) {
      return res.status(404).json({ error: "No readings found for hive" });
    }

    return res.status(200).json({ reading });
  } catch (err) {
    return next(err);
  }
};
