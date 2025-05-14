const db = require('../models/db');
exports.getAllUsers = (req, res) => {
    const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const query =` 
    SELECT 
      u.reg_no, 
      u.fullname, 
      u.email, 
      u.course, 
      u.enrolledyear, 
      u.gender,
      c.college_name
    FROM user u
    JOIN college c ON u.collegeid = c.collegeid
    WHERE u.email = ?`;

  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Database error while fetching user data' });
    }
    if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.status(200).json(results[0]);
  });
};
