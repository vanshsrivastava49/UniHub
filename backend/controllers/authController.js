const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register user
exports.register = async (req, res) => {
  const {
    fullname,
    reg_no,
    course,
    enrolledyear,
    password,
    email,
    gender,
    collegeid,
  } = req.body;

  if (
    !fullname || !reg_no || !course || !enrolledyear ||
    !password || !email || !gender || !collegeid
  ) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const checkQuery = 'SELECT * FROM user WHERE email = ? OR reg_no = ?';
    db.query(checkQuery, [email, reg_no], async (err, existingUsers) => {
      if (err) {
        console.error('User existence check error:', err);
        return res.status(500).json({ error: 'Error checking existing user' });
      }

      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'User already exists with this email or registration number' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const userQuery = `
        INSERT INTO user (fullname, reg_no, course, enrolledyear, password, email, gender, collegeid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        userQuery,
        [fullname, reg_no, course, enrolledyear, hashedPassword, email, gender, collegeid],
        (err, userResult) => {
          if (err) {
            console.error('User insert error:', err);
            return res.status(500).json({ error: 'Error inserting user', details: err });
          }

          const userId = userResult.insertId;
          const loginQuery = `
            INSERT INTO login (user_id, email, password)
            VALUES (?, ?, ?)
          `;

          db.query(loginQuery, [userId, email, hashedPassword], (err2) => {
            if (err2) {
              console.error('Login insert error:', err2);
              return res.status(500).json({ error: 'Error inserting login', details: err2 });
            }

            res.status(201).json({ message: 'User registered successfully' });
          });
        }
      );
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Login user
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const loginQuery = 'SELECT * FROM login WHERE email = ?';

  db.query(loginQuery, [email], async (err, results) => {
    if (err) {
      console.error('Login query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login successful', token });
  });
};