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

/**
 * Create a 400 validation error.
 */
function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.code = "VALIDATION_ERROR";
  return err;
}

/**
 * Require a positive integer id and return the normalized number.
 */
function requirePositiveInt(name, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`Invalid ${name}`);
  }
  return n;
}

/**
 * Normalize order to "asc" or "desc" (defaults to "asc").
 */
function normalizeOrder(order) {
  if (order === undefined || order === null || order === "") return "asc";

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
  if (limit === undefined || limit === null || limit === "") return defaultValue;

  const n = Number(limit);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest("Invalid limit");
  }

  return Math.min(n, max);
}

/**
 * Parse a required date-like input into a Date.
 */
function parseDateLike(name, value) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`Invalid ${name}`);
  }

  const d =
    value instanceof Date ? value : typeof value === "string" || typeof value === "number" ? new Date(value) : null;

  if (!d || Number.isNaN(d.getTime())) {
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

const HIVE_READ_LIMIT = Object.freeze({
  defaultValue: 2000,
  max: 10000,
});

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

  // Pass normalized types to repo (Date objects for timestamps).
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
