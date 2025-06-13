const express = require('express');
const router = express.Router();
const advanceController = require('../controllers/advanceController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, advanceController.getAdvances);
router.post('/', authMiddleware, advanceController.createAdvance);
router.post('/:id/add', authMiddleware, advanceController.addAdvanceAmount);
router.get('/history/:employeeId', authMiddleware, advanceController.getAdvanceHistory);

module.exports = router;
