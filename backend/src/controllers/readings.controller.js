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

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.code = "VALIDATION_ERROR";
  throw err;
}

function requireQuery(req, name) {
  const v = req.query?.[name];
  if (v === undefined || v === null || v === "") {
    badRequest(`${name} is required`);
  }
  return v;
}

function getBeekeeperId(req) {
  const n = Number(req.user?.id);
  if (!Number.isInteger(n) || n <= 0) badRequest("Invalid beekeeperId");
  return n;
}

/* -------------------------------------------------------------------------- */
/* GET /api/readings/since                                                    */
/* -------------------------------------------------------------------------- */
/**
 * Returns readings for a hive since a given timestamp (optional until).
 *
 * Query Params:
 * - hiveId (required) -> positive integer
 * - since (required)  -> ISO date/time string
 * - until (optional)  -> ISO date/time string (exclusive upper bound)
 * - limit (optional)  -> positive int (service caps max)
 * - order (optional)  -> asc | desc
 *
 * Response:
 * - 200 { readings: [...] }
 */
exports.since = async (req, res, next) => {
  try {
    const beekeeperId = getBeekeeperId(req);

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

/* -------------------------------------------------------------------------- */
/* GET /api/readings/latest                                                   */
/* -------------------------------------------------------------------------- */
/**
 * Returns the most recent reading for a hive.
 *
 * Query Params:
 * - hiveId (required) -> positive integer
 *
 * Response:
 * - 200 { reading: {...} }
 * - 404 { error: "No readings found for hive" }
 */
exports.latest = async (req, res, next) => {
  try {
    const beekeeperId = getBeekeeperId(req);
    const hiveId = requireQuery(req, "hiveId");

    const reading = await readingService.getLatestForHive({
      beekeeperId,
      hiveId,
    });

    if (!reading) {
      return res.status(404).json({
        error: "No readings found for hive",
      });
    }

    return res.status(200).json({ reading });
  } catch (err) {
    return next(err);
  }
};
