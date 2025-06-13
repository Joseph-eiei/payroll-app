const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const superuserMiddleware = require('../middleware/superuserMiddleware');

router.post('/', authMiddleware, superuserMiddleware, adminController.createAdmin);

module.exports = router;
