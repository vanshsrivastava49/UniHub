const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/searchUserController');

router.get('/search/:reg_no', auth, c.searchUserByRegNo);

module.exports = router;