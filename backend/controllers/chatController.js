const db = require('../models/db');
const { removeUploaded } = require('../middleware/upload');

exports.sendMessage = async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';

  if ((!message && !req.file) || message.length > 2000) {
    removeUploaded(req.file);
    return res.status(400).json({ error: 'A message (max 2000 characters) or media is required' });
  }

  const media_url = req.file ? `/uploads/chats/${req.file.filename}` : null;
  try {
    const [result] = await db.query('INSERT INTO chatsss (user_id, message, media_url) VALUES (?, ?, ?)', [
      req.user.id,
      message,
      media_url,
    ]);
    res.status(201).json({ message: 'Message sent', chat_id: result.insertId, media_url });
  } catch (err) {
    removeUploaded(req.file);
    throw err;
  }
};

// Returns the most recent N messages (oldest first), not the whole history
exports.getMessages = async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);
  const [rows] = await db.query(
    `SELECT * FROM (
       SELECT c.id, c.user_id, c.message, c.media_url, c.created_at, u.fullname
       FROM chatsss c
       JOIN user u ON c.user_id = u.id
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT ?
     ) recent
     ORDER BY created_at ASC, id ASC`,
    [limit]
  );
  res.json(rows);
};