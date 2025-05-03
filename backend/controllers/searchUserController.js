const db = require('../models/db');

exports.searchUserByRegNo = (req, res) => {
  const reg_no = req.params.reg_no;

  if (!reg_no) {
    return res.status(400).json({ error: 'Registration number is required' });
  }

  const query = `
    SELECT 
      u.reg_no, 
      u.fullname, 
      u.email, 
      u.course, 
      u.enrolledyear, 
      u.gender,
      c.college_name, 
      c.address
    FROM user u
    JOIN college c ON u.collegeid = c.collegeid
    WHERE u.reg_no = ?`;

  db.query(query, [reg_no], (err, results) => {
    if (err) {
      console.error('Database error while searching user:', err);
      return res.status(500).json({ error: 'Database error while searching user' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(results[0]);
  });
};
