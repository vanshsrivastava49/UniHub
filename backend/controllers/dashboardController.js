const db = require('../models/db');

exports.getMe = async (req, res) => {
  try {
    // login signs the token as { user_id, email }, so there is no req.user.id
    const userId = req.user.user_id ?? req.user.id;

    const [rows] = await db.promise().query(
      `SELECT u.id, u.reg_no, u.fullname, u.email, u.course, u.enrolledyear, u.gender, c.college_name
       FROM user u
       LEFT JOIN college c ON u.collegeid = c.collegeid
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Failed to load user' });
  }
};