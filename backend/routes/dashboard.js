const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/dashboardController');

router.get('/me', auth, c.getMe);

module.exports = router;