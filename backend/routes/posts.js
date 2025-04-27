const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const postsController = require('../controllers/postsController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept images and videos only
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Not an image or video!'), false);
      }
    }
  });

router.post('/', upload.single('media'), postsController.createPost);
router.get('/', postsController.getPosts);

module.exports = router;