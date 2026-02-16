"use strict";

/**
 * Express Application Setup
 *
 * Responsibilities:
 * - Configure global middleware
 * - Mount all HTTP routes
 * - Register Swagger UI
 * - Provide centralized error handling
 */

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// ----- Route Imports -----
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const sessionRoutes = require("./routes/sessions.routes");
const hiveRoutes = require("./routes/hives.routes");
const deviceRoutes = require("./routes/devices.routes");
const readingRoutes = require("./routes/readings.routes");
const ingestRoutes = require("./routes/ingest.routes");

// ----- Swagger -----
const { setupSwagger } = require("./swagger.js");

const app = express();

/* ================================================================
 * Global Middleware
 * ================================================================ */

// Trust reverse proxy (required for secure cookies, req.ip, CSRF)
app.set("trust proxy", 1);

app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(cookieParser());

/* ================================================================
 * Routes
 * ================================================================ */

// Internal / frontend-facing API
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/hives", hiveRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/readings", readingRoutes);

// External / hardware-facing ingest API
app.use("/ingest", ingestRoutes);

/* ================================================================
 * Swagger UI
 * ================================================================ */

setupSwagger(app);

/* ================================================================
 * Error Handling
 * ================================================================ */

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
