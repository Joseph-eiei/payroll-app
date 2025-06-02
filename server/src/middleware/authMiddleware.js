// server/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') }); // Ensure .env is loaded if JWT_SECRET is needed here directly

module.exports = function(req, res, next) {
    // Get token from header
    const authHeader = req.header('Authorization'); // Typically "Bearer TOKEN"

    // Check if not token
    if (!authHeader) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const token = authHeader.split(' ')[1]; // Get token from "Bearer TOKEN"
        if (!token) {
            return res.status(401).json({ msg: 'Token format invalid, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded.admin; // Add admin payload to request object
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};