const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/monthly', authMiddleware, payrollController.getMonthlyPayroll);
router.get('/semi-monthly', authMiddleware, payrollController.getSemiMonthlyPayroll);
router.post('/monthly/record', authMiddleware, payrollController.recordMonthlyPayroll);
router.post('/semi-monthly/record', authMiddleware, payrollController.recordSemiMonthlyPayroll);
router.get('/monthly/history', authMiddleware, payrollController.getMonthlyHistory);
router.get('/semi-monthly/history', authMiddleware, payrollController.getSemiMonthlyHistory);

module.exports = router;
