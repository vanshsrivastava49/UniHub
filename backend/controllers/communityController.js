
const db = require('../models/db');

exports.getAllCommunities = (req, res) => {
  const query = 'SELECT * FROM community'; 

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching communities:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(200).json(results); 
  });
};
