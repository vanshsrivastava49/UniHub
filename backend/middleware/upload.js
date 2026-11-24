const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ALLOWED = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};
const ROOT = path.join(__dirname, '..', 'uploads');

function createUpload(subdir = '') {
  const dir = path.join(ROOT, subdir);
  fs.mkdirSync(dir, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, dir),
      filename: (req, file, cb) =>
        cb(null, crypto.randomBytes(16).toString('hex') + path.extname(file.originalname).toLowerCase()),
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ALLOWED[ext] && ALLOWED[ext] === file.mimetype) return cb(null, true);
      const err = new Error('Only JPG, PNG, GIF, WebP, MP4 or WebM files are allowed');
      err.status = 400;
      cb(err);
    },
  });
}

// Delete a file that multer already saved (used when validation fails afterwards)
const removeUploaded = (file) => {
  if (file) fs.unlink(file.path, () => {});
};

module.exports = { createUpload, removeUploaded };