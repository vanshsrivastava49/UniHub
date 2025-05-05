// controllers/communityController.js
const db = require('../models/db');  // Assuming you're using MySQL for database queries

exports.getAllCommunities = (req, res) => {
  const query = 'SELECT * FROM community';  // Your database query

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching communities:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json(results);  // Send the result as a JSON response
  });
};
