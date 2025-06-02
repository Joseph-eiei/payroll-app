// server/src/controllers/authController.js
const pool = require('../config/db'); // Your PostgreSQL connection pool
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // To access JWT_SECRET from .env

exports.loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        // Check for existing admin
        const adminResult = await pool.query('SELECT * FROM Admins WHERE username = $1', [username]);

        if (adminResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials (user not found)' });
        }

        const admin = adminResult.rows[0];

        // Validate password
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials (password incorrect)' });
        }

        // User matched, create JWT payload
        const payload = {
            admin: {
                id: admin.id,
                username: admin.username
                // Add other admin details if needed in the token, but keep it minimal
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, // You need to add JWT_SECRET to your .env file
            { expiresIn: 3600 }, // Token expires in 1 hour (3600 seconds)
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    admin: { // Send back some admin info (optional)
                        id: admin.id,
                        username: admin.username,
                        email: admin.email
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
