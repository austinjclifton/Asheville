const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Connected",
    time: new Date().toUTCString(),
  });
});

module.exports = app;
