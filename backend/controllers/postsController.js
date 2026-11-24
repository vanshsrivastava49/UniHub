const db = require('../models/db');
const { removeUploaded } = require('../middleware/upload');

exports.createPost = async (req, res) => {
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

  if (!content || content.length > 2000) {
    removeUploaded(req.file);
    return res.status(400).json({ error: 'Content is required (max 2000 characters)' });
  }

  const media_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const [result] = await db.query('INSERT INTO posts (user_id, content, media_url) VALUES (?, ?, ?)', [
      req.user.id,
      content,
      media_url,
    ]);
    res.status(201).json({ message: 'Post created successfully', post_id: result.insertId, media_url });
  } catch (err) {
    removeUploaded(req.file);
    throw err;
  }
};

exports.getPosts = async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  const [rows] = await db.query(
    `SELECT p.*, u.fullname
     FROM posts p
     JOIN user u ON p.user_id = u.id
     ORDER BY p.created_at DESC, p.post_id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  res.json(rows);
};