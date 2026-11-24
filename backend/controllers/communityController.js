const db = require('../models/db');

exports.getAllCommunities = async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.*,
            EXISTS (SELECT 1 FROM community_members m
                    WHERE m.community_id = c.community_id AND m.user_id = ?) AS joined
     FROM community c`,
    [req.user.id]
  );
  res.json(rows.map((r) => ({ ...r, joined: !!r.joined })));
};

exports.joinCommunity = async (req, res) => {
  const communityId = Number(req.params.id);
  if (!Number.isInteger(communityId) || communityId <= 0) {
    return res.status(400).json({ error: 'Invalid community id' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('INSERT INTO community_members (community_id, user_id) VALUES (?, ?)', [
      communityId,
      req.user.id,
    ]);
    await conn.query('UPDATE community SET member_count = member_count + 1 WHERE community_id = ?', [communityId]);
    await conn.commit();
    res.status(201).json({ message: 'Joined community' });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Already a member' });
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(404).json({ error: 'Community not found' });
    throw err;
  } finally {
    conn.release();
  }
};