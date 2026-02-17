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

/* ========================================================================== */
/* Helpers                                                                     */
/* ========================================================================== */

function safeQuery(req) {
  return req.query ?? {};
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.code = "VALIDATION_ERROR";
  return err;
}

function requireQueryParam(query, name) {
  const value = query[name];
  if (value === undefined || value === null || value === "") {
    throw badRequest(`${name} is required`);
  }
  return value;
}

function getBeekeeperId(req) {
  const n = Number(req.user?.id);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest("Invalid beekeeperId");
  }
  return n;
}

/* ========================================================================== */
/* Handlers                                                                    */
/* ========================================================================== */

/**
 * GET /api/readings/since
 * Return readings for a hive since an ISO timestamp (optional until/limit/order).
 */
exports.since = async (req, res, next) => {
  try {
    const query = safeQuery(req);

    const readings = await readingService.getHiveReadingsSince({
      beekeeperId: getBeekeeperId(req),
      hiveId: requireQueryParam(query, "hiveId"),
      since: requireQueryParam(query, "since"),
      until: query.until,
      limit: query.limit,
      order: query.order,
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
    const query = safeQuery(req);

    const reading = await readingService.getLatestForHive({
      beekeeperId: getBeekeeperId(req),
      hiveId: requireQueryParam(query, "hiveId"),
    });

    if (!reading) {
      return res.status(404).json({ error: "No readings found for hive" });
    }

    return res.status(200).json({ reading });
  } catch (err) {
    return next(err);
  }
};
