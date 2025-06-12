const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', attendanceController.submitAttendanceForm);
router.get('/pending', authMiddleware, attendanceController.getPendingForms);
router.put('/:id', authMiddleware, attendanceController.updateForm);
router.delete('/:id', authMiddleware, attendanceController.deleteForm);
router.put('/:id/verify', authMiddleware, attendanceController.verifyForm);
router.get('/history', authMiddleware, attendanceController.getVerifiedForms);

module.exports = router;
