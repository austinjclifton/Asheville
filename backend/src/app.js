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
const externalRoutes = require("./routes/externalConditions.routes.js");
const locationsRoutes = require("./routes/locations.routes.js");

// ----- Swagger -----
const { setupSwagger } = require("./utils/swagger.js");

const app = express();

/* ================================================================
 * Global Middleware
 * ================================================================ */

// Trust reverse proxy (required for secure cookies, req.ip, CSRF)
app.set("trust proxy", 1);

app.use(express.json());

// Log all requests (VM/hardware debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(cookieParser());

/* ================================================================
 * VM Debug Endpoints (root)
 * ================================================================ */

app.get("/", (req, res) => {
  console.log("GET request received!");
  return res.json({ message: "Hello from server!", timestamp: Date.now() });
});

app.post("/", (req, res) => {
  console.log("POST request received!");
  console.log("Data:", req.body);
  return res.json({ success: true, received: req.body });
});

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
app.use("/api/external-conditions", externalRoutes);
app.use("/api/locations", locationsRoutes);

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

  return res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// 404 fallback
app.use((req, res) => {
  return res.status(404).json({ error: "Not found" });
});

module.exports = app;