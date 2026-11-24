const router = require('express').Router();
const auth = require('../middleware/auth');
const { createUpload } = require('../middleware/upload');
const c = require('../controllers/chatController');

const upload = createUpload('chats'); // saves to uploads/chats/

router.use(auth);
router.post('/', upload.single('media'), c.sendMessage);
router.get('/', c.getMessages);

module.exports = router;