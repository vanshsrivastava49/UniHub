const db = require('../models/db');

exports.searchUserByRegNo = async (req, res) => {
  const reg_no = (req.params.reg_no || '').trim();
  if (!/^[A-Za-z0-9]{3,20}$/.test(reg_no)) {
    return res.status(400).json({ error: 'Invalid registration number' });
  }

  // Email is intentionally not returned: any logged-in user can search, so it would expose everyone's email.
  const [rows] = await db.query(
    `SELECT u.id, u.reg_no, u.fullname, u.course, u.enrolledyear, u.gender,
            c.college_name, c.address
     FROM user u
     JOIN college c ON u.collegeid = c.collegeid
     WHERE u.reg_no = ?`,
    [reg_no]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
};