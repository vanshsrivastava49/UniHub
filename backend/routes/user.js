const express = require('express');
const router = express.Router();
const searchUserController = require('../controllers/searchUserController');

router.get('/search/:reg_no',searchUserController.searchUserByRegNo);

module.exports = router;
