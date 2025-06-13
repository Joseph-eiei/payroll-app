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

router.get('/water', authMiddleware, deductionController.getWaterCharges);
router.put(
  '/water/:address',
  authMiddleware,
  upload.fields([{ name: 'bill', maxCount: 1 }]),
  deductionController.updateWaterCharge
);

router.get('/electric', authMiddleware, deductionController.getElectricCharges);
router.put(
  '/electric/:address',
  authMiddleware,
  upload.fields([
    { name: 'lastBill', maxCount: 1 },
    { name: 'currentBill', maxCount: 1 },
  ]),
  deductionController.updateElectricCharge
);

module.exports = router;
