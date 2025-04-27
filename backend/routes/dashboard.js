const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController'); // Import the auth middleware

// Route to get all users (protected)
router.get('/users', dashboardController.getAllUsers);

module.exports = router;