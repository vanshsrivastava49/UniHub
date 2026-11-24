const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/colleges', authController.getColleges);
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;
