"use strict";

/**
 * Readings Service
 *
 * Responsibilities:
 * - Enforce policy + validation (ids, dates, limits, ordering)
 * - Delegate ownership enforcement to repo joins (beekeeper -> hive -> device -> reading)
 *
 * Notes:
 * - Timestamp-based only: callers provide explicit since/until
 * - Read-only: telemetry is immutable
 */

const readingRepo = require("../db/readings.db.js");

/* ========================================================================== */
/* Errors + Validation                                                         */
/* ========================================================================== */

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.code = "VALIDATION_ERROR";
  return err;
}

function requirePositiveInt(name, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`Invalid ${name}`);
  }
  return n;
}

/**
 * Default to DESC (most recent first) for time-series.
 */
function normalizeOrder(order) {
  if (order === undefined || order === null || order === "") return "desc";

  const o = String(order).toLowerCase().trim();
  if (o !== "asc" && o !== "desc") {
    throw badRequest("Invalid order");
  }

  return o;
}

/**
 * Normalize limit with defaults and a hard max.
 */
function normalizeLimit(limit, { max, defaultValue }) {
  if (limit === undefined || limit === null || limit === "")
    return defaultValue;

  const n = Number(limit);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest("Invalid limit");
  }

  return Math.min(n, max);
}

/**
 * Parse a required date-like input into a Date.
 * Accepts ISO strings (recommended) and Date objects.
 */
function parseDateLike(name, value) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`Invalid ${name}`);
  }

  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) {
    throw badRequest(`Invalid ${name}`);
  }

  return d;
}

/**
 * Parse optional until and enforce until > since (exclusive upper bound).
 */
function parseOptionalUntil(sinceDate, until) {
  if (until === undefined || until === null || until === "") return null;

  const u = parseDateLike("until", until);
  if (u.getTime() <= sinceDate.getTime()) {
    throw badRequest("Invalid until");
  }

  return u;
}

/**
 * Reasonable defaults:
 * - default 500 keeps responses snappy
 * - max 10000 supports large exports when requested
 */
const HIVE_READ_LIMIT = Object.freeze({
  defaultValue: 500,
  max: 10000,
});

/* ========================================================================== */
/* Public API                                                                  */
/* ========================================================================== */

/**
 * Hive time-series since a timestamp (optional until).
 */
exports.getHiveReadingsSince = async ({
  beekeeperId,
  hiveId,
  since,
  until,
  limit,
  order,
}) => {
  const bkId = requirePositiveInt("beekeeperId", beekeeperId);
  const hId = requirePositiveInt("hiveId", hiveId);

  const sinceDate = parseDateLike("since", since);
  const untilDate = parseOptionalUntil(sinceDate, until);

  const lim = normalizeLimit(limit, HIVE_READ_LIMIT);
  const ord = normalizeOrder(order);

  return readingRepo.getHiveReadingsSince({
    beekeeperId: bkId,
    hiveId: hId,
    since: sinceDate,
    until: untilDate,
    limit: lim,
    order: ord,
  });
};

/**
 * Latest reading across the hive.
 */
exports.getLatestForHive = async ({ beekeeperId, hiveId }) => {
  const bkId = requirePositiveInt("beekeeperId", beekeeperId);
  const hId = requirePositiveInt("hiveId", hiveId);

  return readingRepo.getLatestForHive({
    beekeeperId: bkId,
    hiveId: hId,
  });
};

/**
 * Daily aggregates since a timestamp (stub).
 */
exports.getHiveDailySince = async ({ beekeeperId, hiveId, since, until }) => {
  requirePositiveInt("beekeeperId", beekeeperId);
  requirePositiveInt("hiveId", hiveId);

  const sinceDate = parseDateLike("since", since);
  parseOptionalUntil(sinceDate, until);

  return readingRepo.getHiveDailySince(); // throws NOT_IMPLEMENTED
};
