const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');

// Route for getting all communities
router.get('/', communityController.getAllCommunities);

module.exports = router;
