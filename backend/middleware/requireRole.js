const db = require('../models/db');

// Reads the role from the database on every call, so role changes apply immediately.
// Also attaches collegeid to req.user for college-scoped queries.
module.exports = (...allowedRoles) => async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT role, collegeid FROM user WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });

    const { role, collegeid } = rows[0];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Not allowed for your role' });
    }
    req.user.role = role;
    req.user.collegeid = collegeid;
    next();
  } catch (err) {
    next(err);
  }
};