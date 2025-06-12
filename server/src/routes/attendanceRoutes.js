const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const upload = multer({ dest: path.join(__dirname, '../../uploads') });

router.post('/', upload.single('imageAttachment'), attendanceController.submitAttendanceForm);
router.get('/pending', authMiddleware, attendanceController.getPendingForms);
router.put('/:id', authMiddleware, upload.single('imageAttachment'), attendanceController.updateForm);
router.delete('/:id', authMiddleware, attendanceController.deleteForm);
router.put('/:id/verify', authMiddleware, attendanceController.verifyForm);
router.get('/history', authMiddleware, attendanceController.getVerifiedForms);

module.exports = router;
