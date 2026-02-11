"use strict";

/**
 * Readings Service
 *
 * Responsibilities:
 * - Enforce beekeeper ownership
 * - Apply domain rules
 * - Coordinate repository queries
 * - Stay HTTP-agnostic
 *
 * This layer does NOT:
 * - Know Express
 * - Know req/res
 * - Return HTTP responses
 */

const readingRepo = require("../db/readings.db.js");

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

/* -------------------------------------------------------------------------- */
/* Utilities                                                                   */
/* -------------------------------------------------------------------------- */

function requireBeekeeper(beekeeperId) {
  if (!Number.isInteger(beekeeperId) || beekeeperId <= 0) {
    const err = new Error("Invalid beekeeperId");
    err.status = 400;
    throw err;
  }
}

function normalizeLimit(limit) {
  if (!limit) return DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) return MAX_LIMIT;
  return limit;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * getReadingsForUser
 *
 * Returns readings scoped to a beekeeper.
 */
exports.getReadingsForUser = async ({
  beekeeperId,
  deviceId,
  hiveId,
  from,
  to,
  limit,
}) => {
  requireBeekeeper(beekeeperId);

  if (deviceId && hiveId) {
    const err = new Error("Specify either deviceId or hiveId, not both");
    err.status = 400;
    throw err;
  }

  const finalLimit = normalizeLimit(limit);

  const readings = await readingRepo.findReadings({
    beekeeperId,
    deviceId,
    hiveId,
    from,
    to,
    limit: finalLimit,
  });

  return readings;
};

/**
 * getLatestReadingsForUser
 *
 * Returns latest reading per device
 * or for a specific device/hive.
 */
exports.getLatestReadingsForUser = async ({
  beekeeperId,
  deviceId,
  hiveId,
}) => {
  requireBeekeeper(beekeeperId);

  if (deviceId && hiveId) {
    const err = new Error("Specify either deviceId or hiveId, not both");
    err.status = 400;
    throw err;
  }

  const readings = await readingRepo.findLatestReadings({
    beekeeperId,
    deviceId,
    hiveId,
  });

  return readings;
};

/**
 * getReadingStatsForUser
 *
 * Returns aggregate statistics.
 */
exports.getReadingStatsForUser = async ({
  beekeeperId,
  deviceId,
  hiveId,
  from,
  to,
}) => {
  requireBeekeeper(beekeeperId);

  if (deviceId && hiveId) {
    const err = new Error("Specify either deviceId or hiveId, not both");
    err.status = 400;
    throw err;
  }

  const stats = await readingRepo.findReadingStats({
    beekeeperId,
    deviceId,
    hiveId,
    from,
    to,
  });

  return stats;
};
