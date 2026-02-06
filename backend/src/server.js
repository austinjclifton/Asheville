require("dotenv/config");
const app = require("./app.js");

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Asheville backend running on port ${PORT}`);
});

process.on("SIGINT", () => {
  console.log("\n\nShutting down server...\n");
  server.close(() => {
    process.exit(0);
  });
});
