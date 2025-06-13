const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const superuserMiddleware = require('../middleware/superuserMiddleware');

router.post('/', authMiddleware, superuserMiddleware, adminController.createAdmin);
router.get('/', authMiddleware, superuserMiddleware, adminController.getAllAdmins);
router.put('/:id', authMiddleware, superuserMiddleware, adminController.updateAdmin);
router.delete('/:id', authMiddleware, superuserMiddleware, adminController.deleteAdmin);

module.exports = router;
