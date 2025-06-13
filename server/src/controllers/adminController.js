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

exports.getAllAdmins = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, username, password_hash, email, name, is_superuser, created_at, updated_at FROM Admins ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error('Error in getAllAdmins:', err.message);
        res.status(500).send('Server error while fetching admins');
    }
};

exports.getAdminNames = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, name FROM Admins ORDER BY name'
        );
        res.json(rows);
    } catch (err) {
        console.error('Error in getAdminNames:', err.message);
        res.status(500).send('Server error while fetching admin names');
    }
};

exports.updateAdmin = async (req, res) => {
    const { id } = req.params;
    const { name, email, username, password, is_superuser } = req.body;

    try {
        if (username) {
            const { rows } = await pool.query(
                'SELECT id FROM Admins WHERE username=$1 AND id<>$2',
                [username, id]
            );
            if (rows.length > 0) {
                return res.status(400).json({ msg: 'Username already exists' });
            }
        }

        if (email) {
            const { rows } = await pool.query(
                'SELECT id FROM Admins WHERE email=$1 AND id<>$2',
                [email, id]
            );
            if (rows.length > 0) {
                return res.status(400).json({ msg: 'Email already exists' });
            }
        }

        const fields = [];
        const values = [];
        let idx = 1;

        if (name !== undefined) {
            fields.push(`name=$${idx++}`);
            values.push(name);
        }
        if (email !== undefined) {
            fields.push(`email=$${idx++}`);
            values.push(email);
        }
        if (username !== undefined) {
            fields.push(`username=$${idx++}`);
            values.push(username);
        }
        if (typeof is_superuser !== 'undefined') {
            fields.push(`is_superuser=$${idx++}`);
            values.push(is_superuser);
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            fields.push(`password_hash=$${idx++}`);
            values.push(hash);
        }

        if (fields.length === 0) {
            return res.status(400).json({ msg: 'No fields provided for update' });
        }

        fields.push('updated_at=CURRENT_TIMESTAMP');
        values.push(id);

        const { rows } = await pool.query(
            `UPDATE Admins SET ${fields.join(', ')} WHERE id=$${idx} RETURNING id, username, email, name, is_superuser, password_hash, created_at, updated_at`,
            values
        );
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error in updateAdmin:', err.message);
        res.status(500).send('Server error while updating admin');
    }
};

exports.deleteAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows, rowCount } = await pool.query(
            'DELETE FROM Admins WHERE id=$1 RETURNING id, username',
            [id]
        );
        if (rowCount === 0) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        res.json({ msg: 'Admin deleted', deletedAdmin: rows[0] });
    } catch (err) {
        console.error('Error in deleteAdmin:', err.message);
        res.status(500).send('Server error while deleting admin');
    }
};