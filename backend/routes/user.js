const express = require('express');
const router = express.Router();
const db = require('../models/db'); // assumes db connection in db.js

// Search user by reg_no
router.get('/search/:reg_no', async (req, res) => {
  const { reg_no } = req.params;
  console.log('Incoming search for reg_no:', reg_no);
  try {
    const [rows] = await db.execute(
      `SELECT reg_no, 
       FROM user WHERE reg_no = ?`,
      [reg_no]
    );
    console.log('Query result:', rows);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
