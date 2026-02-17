const express = require('express');
const app = express();

app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Simple GET endpoint
app.get('/', (req, res) => {
  console.log('GET request received!');
  res.json({ message: 'Hello from server!', timestamp: Date.now() });
});

// Simple POST endpoint
app.post('/', (req, res) => {
  console.log('POST request received!');
  console.log('Data:', req.body);
  res.json({ success: true, received: req.body });
});

// Start server
app.listen(4000, '0.0.0.0', () => {
  console.log('Server running on port 4000');
});