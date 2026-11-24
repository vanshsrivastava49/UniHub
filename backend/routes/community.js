const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/communityController');

router.use(auth);
router.get('/', c.getAllCommunities);
router.post('/join/:id', c.joinCommunity);

module.exports = router;