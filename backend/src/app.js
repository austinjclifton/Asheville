/**
 * Express.js Application Setup
 */

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

// ----- Global Middleware -----
app.use(cors());
app.use(express.json());

// ----- Routes -----
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

// ----- Fallbacks -----
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

module.exports = app;
