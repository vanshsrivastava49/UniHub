const router = require('express').Router();
const auth = require('../middleware/auth');
const { createUpload } = require('../middleware/upload');
const c = require('../controllers/postsController');

const upload = createUpload(''); // saves to uploads/

router.use(auth);
router.post('/', upload.single('media'), c.createPost);
router.get('/', c.getPosts);

module.exports = router;