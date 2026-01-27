"use strict";

/**
 * Reading Service (MVP)
 *
 * Responsibilities:
 * - Own reading-related business logic
 * - Enforce ownership through device → hive → beekeeper
 * - Stay HTTP-agnostic
 *
 * This file intentionally:
 * - Contains ONLY exported service functions
 * - Uses minimal inline validation
 * - Avoids premature abstractions
 *
 * DB/repository logic will be injected later.
 */

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

const DEFAULT_LIMIT = 100;

/* -------------------------------------------------------------------------- */
/* Utilities (MVP-only, minimal)                                               */
/* -------------------------------------------------------------------------- */

/**
 * No shared helpers required for MVP.
 */

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * getReadingsForUser
 *
 * Returns readings scoped to a beekeeper.
 * Can be filtered by device or hive.
 */
exports.getReadingsForUser = async ({
  beekeeperId,
  deviceId,
  hiveId,
  from,
  to,
  limit,
}) => {
  if (!beekeeperId) {
    throw new Error("beekeeperId is required");
  }

  if (deviceId && hiveId) {
    throw new Error("Specify either deviceId or hiveId, not both");
  }

  // TODO (DB layer):
  // - verify ownership via joins
  // - apply filters (deviceId, hiveId)
  // - apply time range (from/to)
  // - apply limit

  return [];
};

/**
 * getLatestReadingForUser
 *
 * Returns the most recent reading for a device or hive.
 */
exports.getLatestReadingForUser = async ({
  beekeeperId,
  deviceId,
  hiveId,
}) => {
  if (!beekeeperId) {
    throw new Error("beekeeperId is required");
  }

  if (!deviceId && !hiveId) {
    throw new Error("deviceId or hiveId is required");
  }

  if (deviceId && hiveId) {
    throw new Error("Specify either deviceId or hiveId, not both");
  }

  // TODO (DB layer):
  // - verify ownership
  // - fetch most recent reading ordered by timestamp DESC

  return null;
};
