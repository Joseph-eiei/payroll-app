const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.createAdmin = async (req, res) => {
    const { name, email, username, password, is_superuser } = req.body;

    if (!name || !email || !username || !password) {
        return res.status(400).json({ msg: 'Please provide all required fields' });
    }

    try {
        const existing = await pool.query(
            'SELECT id FROM Admins WHERE username=$1 OR email=$2',
            [username, email]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ msg: 'Username or email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const { rows } = await pool.query(
            `INSERT INTO Admins (username, password_hash, email, name, is_superuser, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
             RETURNING id, username, email, name, is_superuser`,
            [username, hash, email, name, is_superuser === true || is_superuser === 'true']
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error in createAdmin:', err.message);
        res.status(500).send('Server error while creating admin');
    }
};
