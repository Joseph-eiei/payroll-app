const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savingsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/history/:employeeId', authMiddleware, savingsController.getSavingsHistory);

module.exports = router;
