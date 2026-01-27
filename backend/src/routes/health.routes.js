const express = require("express");
const router = express.Router();

/**
 * GET /health
 *
 * Purpose:
 * - Confirm server is running and responding
 */
router.get("/", async (req, res, next) => {
  try {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // This should realistically never happen, but we will forward for consistency
    next(err);
  }
});

module.exports = router;
