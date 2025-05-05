const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friendsController');

router.post('/send', friendsController.sendFriendRequest);
router.get('/requests/:user_id', friendsController.getPendingRequests);
router.post('/accept', friendsController.acceptFriendRequest);
router.post('/decline', friendsController.declineFriendRequest);

module.exports = router;
