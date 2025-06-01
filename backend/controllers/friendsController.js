const pool = require('../models/db');

exports.sendFriendRequest = async (req, res) => {
    const { user_id, friend_user_id } = req.body;
  
    if (!user_id || !friend_user_id) {
      return res.status(400).json({ message: 'User ID and Friend User ID are required' });
    }
  
    try {
      const [existing] = await pool.query(
        'SELECT * FROM friends WHERE user_id = ? AND friend_user_id = ?',
        [user_id, friend_user_id]
      );
  
      if (existing.length > 0) {
        return res.status(400).json({ message: 'Friend request already sent or exists' });
      }
      await pool.query(
        'INSERT INTO friends (user_id, friend_user_id, status) VALUES (?, ?, ?)',
        [user_id, friend_user_id, 'pending']
      );
  
      res.status(200).json({ message: 'Friend request sent' });
    } catch (err) {
      console.error('Error sending friend request:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };

exports.getPendingRequests = async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    const [requests] = await pool.query(
      `SELECT f.friend_id, u.id as sender_id, u.fullname, u.email, u.reg_no
       FROM friends f
       JOIN user u ON f.user_id = u.id
       WHERE f.friend_user_id = ? AND f.status = 'pending'`,
      [user_id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ message: 'No pending friend requests found' });
    }

    res.json(requests);
  } catch (err) {
    console.error("Error fetching friend requests:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Accept a friend request
exports.acceptFriendRequest = async (req, res) => {
  const { friend_id } = req.body;

  if (!friend_id) {
    return res.status(400).json({ message: 'Friend ID is required' });
  }

  try {
    const [existingRequest] = await pool.query(
      'SELECT * FROM friends WHERE friend_id = ? AND status = "pending"',
      [friend_id]
    );

    if (existingRequest.length === 0) {
      return res.status(404).json({ message: 'Friend request not found or already accepted' });
    }

    await pool.query(
      'UPDATE friends SET status = "accepted" WHERE friend_id = ?',
      [friend_id]
    );

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error("Error accepting friend request:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Decline a friend request
exports.declineFriendRequest = async (req, res) => {
  const { friend_id } = req.body;

  if (!friend_id) {
    return res.status(400).json({ message: 'Friend ID is required' });
  }

  try {
    const [existingRequest] = await pool.query(
      'SELECT * FROM friends WHERE friend_id = ? AND status = "pending"',
      [friend_id]
    );

    if (existingRequest.length === 0) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    await pool.query(
      'DELETE FROM friends WHERE friend_id = ?',
      [friend_id]
    );

    res.json({ message: 'Friend request declined' });
  } catch (err) {
    console.error("Error declining friend request:", err);
    res.status(500).json({ message: 'Server error' });
  }
};
