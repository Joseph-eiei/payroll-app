// server/src/server.js
const path = require('path'); // Import the 'path' module from Node.js
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // We'll create this next

const app = express();
const PORT = process.env.PORT; //|| 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies

// Basic Route
app.get('/api', (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes')); // Mount authentication routes
app.use('/api/employees', require('./routes/employeeRoutes'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
