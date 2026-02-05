require("dotenv/config");
const app = require("./app.js");

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Asheville backend running on port ${PORT}`);
});
