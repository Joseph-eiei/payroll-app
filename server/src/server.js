// server/src/server.js
const path = require('path'); // Import the 'path' module from Node.js
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const pool = require('./config/db'); // We'll create this next
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT; //|| 3000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic Route
app.get('/api', (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes')); // Mount authentication routes
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/deductions', require('./routes/deductionRoutes'));
app.use('/api/advances', require('./routes/advanceRoutes'));
app.use('/api/savings', require('./routes/savingsRoutes'));
app.use('/api/admins', require('./routes/adminRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));

// Automatically remove last month's verified attendance records on the 10th of each month
cron.schedule('0 0 10 * *', async () => {
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth(), 0); // last day of previous month
  const m = prevMonthDate.getMonth() + 1;
  const y = prevMonthDate.getFullYear();
  try {
    const { rows } = await pool.query(
      `SELECT image_attachment FROM AttendanceForms
       WHERE is_verified = true
       AND EXTRACT(MONTH FROM attendance_date) = $1
       AND EXTRACT(YEAR FROM attendance_date) = $2`,
      [m, y]
    );

    await pool.query(
      `DELETE FROM AttendanceForms
       WHERE is_verified = true
       AND EXTRACT(MONTH FROM attendance_date) = $1
       AND EXTRACT(YEAR FROM attendance_date) = $2`,
      [m, y]
    );

    for (const row of rows) {
      if (row.image_attachment) {
        const filePath = path.join(__dirname, '../uploads', row.image_attachment);
        try {
          await fs.promises.unlink(filePath);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error('Error deleting old image file:', err.message);
          }
        }
      }
    }

    console.log('Old attendance records deleted for', m, y);
  } catch (err) {
    console.error('Error deleting old attendance records:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
