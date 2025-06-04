// server/src/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');

// Define routes
router.get('/', authMiddleware, employeeController.getAllEmployees);
router.get('/role/:role', employeeController.getEmployeesByRole);
router.post('/', authMiddleware, employeeController.createEmployee);
router.put('/:id', authMiddleware, employeeController.updateEmployee);
router.delete('/:id', authMiddleware, employeeController.deleteEmployee);

module.exports = router;