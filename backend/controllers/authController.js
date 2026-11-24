const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Column limits taken from the `user` table schema
const LIMITS = { fullname: 50, reg_no: 20, course: 50, email: 100 };

// `user.gender` is varchar(10), so the old value 'prefer_not_to_say' (17 chars)
// can't be stored. Normalise it to a short value.
const GENDER_MAP = {
  male: 'male',
  female: 'female',
  other: 'other',
  not_say: 'not_say',
  prefer_not_to_say: 'not_say',
};

exports.getColleges = async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query('SELECT collegeid, college_name FROM college ORDER BY college_name');
    res.json(rows);
  } catch (err) {
    console.error('Fetch colleges error:', err);
    res.status(500).json({ error: 'Could not load colleges' });
  }
};

exports.register = async (req, res) => {
  const body = req.body || {};
  const str = (v) => (v === undefined || v === null ? '' : String(v).trim());

  const fullname = str(body.fullname);
  const reg_no = str(body.reg_no);
  const course = str(body.course);
  const email = str(body.email).toLowerCase();
  const password = body.password === undefined || body.password === null ? '' : String(body.password);
  const gender = GENDER_MAP[str(body.gender).toLowerCase()];
  const enrolledyear = Number.parseInt(body.enrolledyear, 10);
  const collegeid = Number.parseInt(body.collegeid, 10);

  // ---- validation that mirrors the table definition ----
  if (!fullname || !reg_no || !course || !email || !password ||
      !str(body.enrolledyear) || !str(body.collegeid) || !str(body.gender)) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  for (const [field, max] of Object.entries(LIMITS)) {
    const value = { fullname, reg_no, course, email }[field];
    if (value.length > max) {
      return res.status(400).json({ error: `${field} must be at most ${max} characters` });
    }
  }
  if (!gender) {
    return res.status(400).json({ error: 'Invalid gender value' });
  }
  if (!Number.isInteger(enrolledyear) || enrolledyear < 1990 || enrolledyear > new Date().getFullYear() + 1) {
    return res.status(400).json({ error: 'Enrolled year must be a valid year (e.g. 2023)' });
  }
  if (!Number.isInteger(collegeid)) {
    return res.status(400).json({ error: 'Please select a valid college' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const conn = await db.promise().getConnection();
  try {
    // collegeid is a foreign key -> give a clear message instead of a raw FK error
    const [college] = await conn.query('SELECT collegeid FROM college WHERE collegeid = ?', [collegeid]);
    if (college.length === 0) {
      return res.status(400).json({ error: 'Selected college does not exist' });
    }

    const [existing] = await conn.query(
      'SELECT email, reg_no FROM user WHERE email = ? OR reg_no = ?',
      [email, reg_no]
    );
    if (existing.length > 0) {
      const emailTaken = existing.some((u) => String(u.email).toLowerCase() === email);
      return res.status(409).json({
        error: emailTaken
          ? 'An account with this email already exists'
          : 'An account with this registration number already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // `user` and `login` must both be written, or neither (no orphan users)
    await conn.beginTransaction();
    const [userResult] = await conn.query(
      `INSERT INTO user (fullname, reg_no, course, enrolledyear, password, email, gender, collegeid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [fullname, reg_no, course, enrolledyear, hashedPassword, email, gender, collegeid]
    );
    await conn.query(
      'INSERT INTO login (user_id, email, password) VALUES (?, ?, ?)',
      [userResult.insertId, email, hashedPassword]
    );
    await conn.commit();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    try { await conn.rollback(); } catch (_) { /* nothing to roll back */ }
    console.error('Registration error:', err);

    // race between the SELECT check and the INSERT, or unique keys on email/reg_no
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'User already exists with this email or registration number' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Selected college does not exist' });
    }
    if (err.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ error: 'One of the fields is too long' });
    }
    return res.status(500).json({ error: 'Server error while registering' });
  } finally {
    conn.release();
  }
};

exports.login = async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const [results] = await db.query(
    `SELECT l.user_id, l.email, l.password, u.role
     FROM login l
     JOIN user u ON u.id = l.user_id
     WHERE l.email = ?`,
    [email]
  );
  if (results.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = results[0];
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.status(200).json({ message: 'Login successful', token, role: user.role });
};