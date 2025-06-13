const pool = require('../config/db');

module.exports = async function(req, res, next) {
    const adminId = req.admin && req.admin.id;
    if (!adminId) {
        return res.status(401).json({ msg: 'No admin ID in request' });
    }

    try {
        const { rows } = await pool.query('SELECT is_superuser FROM Admins WHERE id=$1', [adminId]);
        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Admin not found' });
        }
        if (!rows[0].is_superuser) {
            return res.status(403).json({ msg: 'Access denied: superuser only' });
        }
        next();
    } catch (err) {
        console.error('Error in superuserMiddleware:', err.message);
        res.status(500).send('Server error');
    }
};
