const db = require('../models/db');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.createPost = (req, res) => {
  const { content, email } = req.body;
  let media_url = null;

  if (req.file) {
    media_url = `/uploads/${req.file.filename}`;
  }
  console.log('Received post request:', { content, email });

  if (!content || !email) {
    return res.status(400).json({ error: 'Content and email are required' });
  }
  const userQuery = 'SELECT id FROM user WHERE email = ?';
  db.query(userQuery, [email], (err, userResults) => {
    if (err) {
      console.error('Error finding user:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user_id = userResults[0].id;
    const query = 'INSERT INTO posts (user_id, content,media_url) VALUES (?, ?,?)';
    
    db.query(query, [user_id, content, media_url], (err, results) => {
      if (err) {
        console.error('Error creating post:', err);
        return res.status(500).json({ error: 'Error creating post' });
      }
      res.status(201).json({ 
        message: 'Post created successfully',
        post_id: results.insertId,
        media_url: media_url
      });
    });
  });
};
exports.getPosts = (req, res) => {
  const query = `
    SELECT 
      p.*,
      u.fullname,
      u.email 
    FROM posts p 
    JOIN user u ON p.user_id = u.id 
    ORDER BY p.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching posts:', err);
      return res.status(500).json({ error: 'Database error while fetching posts' });
    }
    res.status(200).json(results);
  });
};