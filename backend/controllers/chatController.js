const db = require('../models/db');
const path = require('path');
const fs = require('fs');

const chatUploadsDir = path.join(__dirname, '../uploads/chats');
if (!fs.existsSync(chatUploadsDir)) {
    fs.mkdirSync(chatUploadsDir, { recursive: true });
}

exports.sendMessage = (req, res) => {
  const { email, message } = req.body;
  let media_url = null;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  if (req.file) {
    media_url = `/uploads/chats/${req.file.filename}`;
  }

  const getUserQuery = 'SELECT id FROM user WHERE email = ?';
  db.query(getUserQuery, [email], (err, userRes) => {
    if (err || userRes.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user_id = userRes[0].id;
    const insertQuery = `INSERT INTO chatsss (user_id, message, media_url) VALUES (?, ?, ?)`;
    db.query(insertQuery, [user_id, message, media_url], (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to send message' });

      res.status(201).json({
        message: 'Message sent',
        chat_id: result.insertId,
        media_url
      });
    });
  });
};

exports.getMessages = (req, res) => {
  const query = `
    SELECT c.*, u.fullname, u.email
    FROM chatsss c
    JOIN user u ON c.user_id = u.id
    ORDER BY c.created_at ASC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error fetching messages' });
    res.status(200).json(results);
  });
};
