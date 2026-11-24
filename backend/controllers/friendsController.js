const db = require('../models/db');

const toId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);

exports.sendFriendRequest = async (req, res) => {
  const me = req.user.id;
  const target = toId(req.body.friend_user_id);

  if (!target) return res.status(400).json({ error: 'Valid friend_user_id is required' });
  if (target === me) return res.status(400).json({ error: 'You cannot send a request to yourself' });

  const [users] = await db.query('SELECT id FROM user WHERE id = ?', [target]);
  if (users.length === 0) return res.status(404).json({ error: 'User not found' });

  // Check both directions (A->B or B->A)
  const [existing] = await db.query(
    `SELECT friend_id FROM friends
     WHERE (user_id = ? AND friend_user_id = ?) OR (user_id = ? AND friend_user_id = ?)`,
    [me, target, target, me]
  );
  if (existing.length > 0) {
    return res.status(409).json({ error: 'A friend request or friendship already exists' });
  }

  await db.query("INSERT INTO friends (user_id, friend_user_id, status) VALUES (?, ?, 'pending')", [me, target]);
  res.status(201).json({ message: 'Friend request sent' });
};

exports.getPendingRequests = async (req, res) => {
  const [rows] = await db.query(
    `SELECT f.friend_id, u.id AS sender_id, u.fullname, u.reg_no
     FROM friends f
     JOIN user u ON f.user_id = u.id
     WHERE f.friend_user_id = ? AND f.status = 'pending'`,
    [req.user.id]
  );
  res.json(rows); // empty array is a valid result, not a 404
};

// Only the recipient of a request may accept or decline it
exports.acceptFriendRequest = async (req, res) => {
  const friendId = toId(req.body.friend_id);
  if (!friendId) return res.status(400).json({ error: 'Valid friend_id is required' });

  const [result] = await db.query(
    "UPDATE friends SET status = 'accepted' WHERE friend_id = ? AND friend_user_id = ? AND status = 'pending'",
    [friendId, req.user.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Friend request not found' });
  res.json({ message: 'Friend request accepted' });
};

exports.declineFriendRequest = async (req, res) => {
  const friendId = toId(req.body.friend_id);
  if (!friendId) return res.status(400).json({ error: 'Valid friend_id is required' });

  const [result] = await db.query(
    "DELETE FROM friends WHERE friend_id = ? AND friend_user_id = ? AND status = 'pending'",
    [friendId, req.user.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Friend request not found' });
  res.json({ message: 'Friend request declined' });
};