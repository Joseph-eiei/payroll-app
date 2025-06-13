const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const deductionController = require('../controllers/deductionController');
const authMiddleware = require('../middleware/authMiddleware');

const upload = multer({ dest: path.join(__dirname, '../../uploads') });

router.get('/types', authMiddleware, deductionController.getDeductionTypes);
router.post('/types', authMiddleware, deductionController.createDeductionType);
router.put('/types/:id', authMiddleware, deductionController.updateDeductionType);
router.delete('/types/:id', authMiddleware, deductionController.deleteDeductionType);

router.get('/accommodation', authMiddleware, deductionController.getAccommodationCharges);
router.put(
  '/accommodation/:type',
  authMiddleware,
  upload.fields([
    { name: 'waterBill', maxCount: 1 },
    { name: 'electricBill', maxCount: 1 },
  ]),
  deductionController.updateAccommodationCharge
);

module.exports = router;
