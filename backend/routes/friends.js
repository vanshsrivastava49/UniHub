const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/friendsController');

router.use(auth);
router.post('/send', c.sendFriendRequest);
router.get('/requests', c.getPendingRequests);
router.post('/accept', c.acceptFriendRequest);
router.post('/decline', c.declineFriendRequest);

module.exports = router;