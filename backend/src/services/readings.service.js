"use strict";

/**
 * readings service function index
 *
 * Time-series (timestamp-based only)
 * - getHiveReadingsSince(params): Hive readings since a timestamp (optional until)
 *
 * Latest
 * - getLatestForHive(params): Latest reading across the hive
 *
 * Daily Aggregates (future)
 * - getHiveDailySince(params): STUB — daily points since a timestamp (optional until)
 *
 * - notes
 * - This service is the policy + validation gate (IDs, dates, limits, ordering)
 * - Repo enforces ownership via joins: beekeeper -> hive -> device -> reading
 * - No window presets here: callers must send explicit timestamps
 */

const readingRepo = require("../db/readings.db.js");

/* ========================================================================== */
/* Errors                                                                      */
/* ========================================================================== */

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  err.code = "VALIDATION_ERROR";
  return err;
}

/* ========================================================================== */
/* Validation / Normalization                                                  */
/* ========================================================================== */

function requirePositiveInt(name, value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`Invalid ${name}`);
  return n;
}

function normalizeOrder(order) {
  if (order === undefined || order === null || order === "") return "asc";
  const o = String(order).toLowerCase().trim();
  if (o !== "asc" && o !== "desc") throw badRequest("Invalid order");
  return o;
}

function normalizeLimit(limit, { max, defaultValue }) {
  if (limit === undefined || limit === null || limit === "") return defaultValue;
  const n = Number(limit);
  if (!Number.isInteger(n) || n <= 0) throw badRequest("Invalid limit");
  return Math.min(n, max);
}

function parseDateLike(name, value) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`Invalid ${name}`);
  }

  let d;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "string" || typeof value === "number") {
    d = new Date(value);
  } else {
    throw badRequest(`Invalid ${name}`);
  }

  if (Number.isNaN(d.getTime())) throw badRequest(`Invalid ${name}`);
  return d;
}

function parseOptionalUntil(sinceDate, until) {
  if (until === undefined || until === null || until === "") return null;

  const u = parseDateLike("until", until);
  if (u.getTime() <= sinceDate.getTime()) throw badRequest("Invalid until");
  return u;
}

/* ========================================================================== */
/* Policy                                                                       */
/* ========================================================================== */

const HIVE_READ_LIMIT = Object.freeze({
  defaultValue: 2000,
  max: 10000,
});

/* ========================================================================== */
/* Public API (Hive-first)                                                     */
/* ========================================================================== */

/**
 * getHiveReadingsSince
 *
 * Hive time-series since a timestamp (optional until).
 *
 * Required:
 * - beekeeperId
 * - hiveId
 * - since
 *
 * Optional:
 * - until (exclusive upper bound; must be > since)
 * - limit (default 2000, max 10000)
 * - order ("asc" default; "desc" supported)
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
 * getLatestForHive
 *
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

/* ========================================================================== */
/* Daily Aggregates (stub)                                                     */
/* ========================================================================== */

/**
 * getHiveDailySince (STUB)
 *
 * Future: returns daily data points (1 row/day) from reading_daily.
 * Signature is timestamp-based to match the rest of the API.
 */
exports.getHiveDailySince = async ({ beekeeperId, hiveId, since, until }) => {
  requirePositiveInt("beekeeperId", beekeeperId);
  requirePositiveInt("hiveId", hiveId);

  const sinceDate = parseDateLike("since", since);
  parseOptionalUntil(sinceDate, until);

  return readingRepo.getHiveDailySince(); // throws NOT_IMPLEMENTED
};
