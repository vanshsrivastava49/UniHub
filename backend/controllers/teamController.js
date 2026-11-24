const db = require('../models/db');

const EVENT_TYPES = ['hackathon', 'competition', 'project'];

const httpError = (status, message) => Object.assign(new Error(message), { status });
const toId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
const str = (v) => (typeof v === 'string' ? v.trim() : '');

const localToday = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

// ------------------------------------------------------------------
// Matching logic
// ------------------------------------------------------------------
// levels: Map<skill_id, level 1..3>. A Beginner skill earns 0.73 credit,
// Intermediate 0.87, Advanced 1.0.
function skillCoverage(required, levels) {
  const matched = required.filter((r) => levels.has(r.skill_id));
  const missing = required.filter((r) => !levels.has(r.skill_id));
  const credit = matched.reduce((sum, r) => sum + 0.6 + 0.4 * (levels.get(r.skill_id) / 3), 0);
  return { matched, missing, coverage: required.length ? credit / required.length : 0 };
}

async function getCollegeId(userId) {
  const [rows] = await db.query('SELECT collegeid FROM user WHERE id = ?', [userId]);
  if (rows.length === 0) throw httpError(401, 'User not found');
  return rows[0].collegeid;
}

async function attachRequiredSkills(posts) {
  if (posts.length === 0) return posts;
  const ids = posts.map((p) => p.team_post_id);
  const [rows] = await db.query(
    `SELECT tps.team_post_id, s.skill_id, s.skill_name
     FROM team_post_skills tps JOIN skills s ON s.skill_id = tps.skill_id
     WHERE tps.team_post_id IN (?)`,
    [ids]
  );
  const byPost = new Map();
  for (const r of rows) {
    if (!byPost.has(r.team_post_id)) byPost.set(r.team_post_id, []);
    byPost.get(r.team_post_id).push({ skill_id: r.skill_id, skill_name: r.skill_name });
  }
  return posts.map((p) => ({ ...p, required_skills: byPost.get(p.team_post_id) || [] }));
}

const isRegistered = async (eventId, userId) => {
  const [rows] = await db.query(
    'SELECT 1 FROM event_registrations WHERE event_id = ? AND user_id = ?',
    [eventId, userId]
  );
  return rows.length > 0;
};

// Approved, upcoming events in my college that accept teams (for the Team Finder)
exports.listTeamEvents = async (req, res) => {
  const [rows] = await db.query(
    `SELECT e.event_id, e.title, e.event_date, e.category,
            EXISTS (SELECT 1 FROM event_registrations r
                    WHERE r.event_id = e.event_id AND r.user_id = ?) AS is_registered
     FROM events e
     WHERE e.collegeid = (SELECT collegeid FROM user WHERE id = ?)
       AND e.status = 'approved'
       AND e.allows_teams = 1
       AND e.event_date >= CURDATE()
     ORDER BY e.event_date ASC`,
    [req.user.id, req.user.id]
  );
  res.json(rows);
};

// ------------------------------------------------------------------
// Skills
// ------------------------------------------------------------------
exports.listSkills = async (req, res) => {
  const [rows] = await db.query('SELECT skill_id, skill_name, category FROM skills ORDER BY category, skill_name');
  res.json(rows);
};

exports.createSkill = async (req, res) => {
  const name = str(req.body.skill_name);
  if (!/^[A-Za-z0-9 .+#/-]{1,40}$/.test(name)) {
    return res.status(400).json({ error: 'Skill name must be 1-40 characters (letters, digits, . + # / -)' });
  }
  await db.query("INSERT IGNORE INTO skills (skill_name, category) VALUES (?, 'Other')", [name]);
  const [rows] = await db.query('SELECT skill_id, skill_name, category FROM skills WHERE skill_name = ?', [name]);
  res.status(201).json(rows[0]);
};

exports.getMySkills = async (req, res) => {
  const [rows] = await db.query(
    `SELECT s.skill_id, s.skill_name, s.category, us.level
     FROM user_skills us JOIN skills s ON s.skill_id = us.skill_id
     WHERE us.user_id = ? ORDER BY s.skill_name`,
    [req.user.id]
  );
  res.json(rows);
};

// Replaces the user's whole skill list: body = { skills: [{ skill_id, level }] }
exports.setMySkills = async (req, res) => {
  const input = Array.isArray(req.body.skills) ? req.body.skills : [];
  if (input.length > 20) return res.status(400).json({ error: 'You can add at most 20 skills' });

  const seen = new Set();
  const rows = [];
  for (const s of input) {
    const skillId = toId(s.skill_id);
    const level = Number(s.level);
    if (!skillId || ![1, 2, 3].includes(level)) {
      return res.status(400).json({ error: 'Each skill needs a valid skill_id and a level of 1, 2 or 3' });
    }
    if (seen.has(skillId)) continue;
    seen.add(skillId);
    rows.push([req.user.id, skillId, level]);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM user_skills WHERE user_id = ?', [req.user.id]);
    if (rows.length > 0) {
      await conn.query('INSERT INTO user_skills (user_id, skill_id, level) VALUES ?', [rows]);
    }
    await conn.commit();
    res.json({ message: 'Skills saved', count: rows.length });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Unknown skill selected' });
    throw err;
  } finally {
    conn.release();
  }
};

// ------------------------------------------------------------------
// Team posts
// ------------------------------------------------------------------
exports.createPost = async (req, res) => {
  const b = req.body || {};
  const title = str(b.title);
  const description = str(b.description);
  const event_type = str(b.event_type).toLowerCase();
  const team_size = Number.parseInt(b.team_size, 10);
  const deadline = str(b.deadline);
  const eventId = toId(b.event_id);
  const skillIds = [...new Set((Array.isArray(b.skill_ids) ? b.skill_ids : []).map(toId))];

  if (!eventId) return res.status(400).json({ error: 'Choose the event this team is for' });
  if (!title || title.length > 100) return res.status(400).json({ error: 'Title is required (max 100 characters)' });
  if (description.length > 1000) return res.status(400).json({ error: 'Description is too long (max 1000 characters)' });
  if (!EVENT_TYPES.includes(event_type)) return res.status(400).json({ error: 'Invalid event type' });
  if (!Number.isInteger(team_size) || team_size < 2 || team_size > 10) {
    return res.status(400).json({ error: 'Team size must be between 2 and 10' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || Number.isNaN(new Date(`${deadline}T00:00:00`).getTime())) {
    return res.status(400).json({ error: 'Deadline must be a valid date (YYYY-MM-DD)' });
  }
  if (deadline < localToday()) return res.status(400).json({ error: 'Deadline cannot be in the past' });
  if (skillIds.length === 0 || skillIds.length > 10 || skillIds.includes(null)) {
    return res.status(400).json({ error: 'Choose between 1 and 10 required skills' });
  }

  const [evRows] = await db.query(
    `SELECT title FROM events
     WHERE event_id = ? AND status = 'approved' AND allows_teams = 1
       AND event_date >= CURDATE()
       AND collegeid = (SELECT collegeid FROM user WHERE id = ?)`,
    [eventId, req.user.id]
  );
  if (evRows.length === 0) return res.status(400).json({ error: 'This event is not open for teams' });
  if (!(await isRegistered(eventId, req.user.id))) {
    return res.status(403).json({ error: 'Register for this event before creating a team for it' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO team_posts (creator_id, title, event_name, event_type, description, team_size, deadline, event_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, evRows[0].title, event_type, description, team_size, deadline, eventId]
    );
    const postId = result.insertId;
    await conn.query('INSERT INTO team_post_skills (team_post_id, skill_id) VALUES ?', [skillIds.map((s) => [postId, s])]);
    await conn.query('INSERT INTO team_members (team_post_id, user_id) VALUES (?, ?)', [postId, req.user.id]);
    await conn.commit();
    res.status(201).json({ message: 'Team post created', team_post_id: postId });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Unknown skill selected' });
    throw err;
  } finally {
    conn.release();
  }
};

// Open posts from my college, ranked by how well MY skills fit the requirements.
// Optional ?event_id= filter.
exports.listOpenPosts = async (req, res) => {
  const me = req.user.id;
  const collegeId = await getCollegeId(me);
  const eventFilter = toId(req.query.event_id);

  const [posts] = await db.query(
    `SELECT p.team_post_id, p.event_id, p.title, p.event_name, p.event_type, p.description, p.team_size,
            p.deadline, p.created_at, u.fullname AS creator_name,
            (SELECT COUNT(*) FROM team_members m WHERE m.team_post_id = p.team_post_id) AS member_count,
            EXISTS (SELECT 1 FROM team_members m WHERE m.team_post_id = p.team_post_id AND m.user_id = ?) AS is_member,
            (SELECT r.status FROM team_requests r WHERE r.team_post_id = p.team_post_id AND r.user_id = ?) AS my_request_status,
            (SELECT r.kind   FROM team_requests r WHERE r.team_post_id = p.team_post_id AND r.user_id = ?) AS my_request_kind
     FROM team_posts p
     JOIN user u ON u.id = p.creator_id
     WHERE p.status = 'open' AND p.deadline >= CURDATE()
       AND p.creator_id <> ? AND u.collegeid = ?
       AND (? IS NULL OR p.event_id = ?)
     ORDER BY p.created_at DESC
     LIMIT 100`,
    [me, me, me, me, collegeId, eventFilter, eventFilter]
  );

  const withSkills = await attachRequiredSkills(posts);
  const [mine] = await db.query('SELECT skill_id, level FROM user_skills WHERE user_id = ?', [me]);
  const levels = new Map(mine.map((s) => [s.skill_id, s.level]));

  const ranked = withSkills
    .map((p) => {
      const { matched, missing, coverage } = skillCoverage(p.required_skills, levels);
      return {
        ...p,
        is_member: !!p.is_member,
        match_pct: Math.round(coverage * 100),
        matched_skills: matched.map((s) => s.skill_name),
        missing_skills: missing.map((s) => s.skill_name),
      };
    })
    .sort((a, b) => b.match_pct - a.match_pct);

  res.json(ranked);
};

exports.listMyPosts = async (req, res) => {
  const [posts] = await db.query(
    `SELECT p.team_post_id, p.title, p.event_name, p.event_type, p.description, p.team_size,
            p.deadline, p.status, p.created_at,
            (SELECT COUNT(*) FROM team_members m WHERE m.team_post_id = p.team_post_id) AS member_count,
            (SELECT COUNT(*) FROM team_requests r WHERE r.team_post_id = p.team_post_id AND r.status = 'pending') AS pending_count
     FROM team_posts p WHERE p.creator_id = ? ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  const withSkills = await attachRequiredSkills(posts);
  if (withSkills.length === 0) return res.json([]);

  const [members] = await db.query(
    `SELECT m.team_post_id, u.id, u.fullname, u.course
     FROM team_members m JOIN user u ON u.id = m.user_id
     WHERE m.team_post_id IN (?) ORDER BY m.joined_at`,
    [withSkills.map((p) => p.team_post_id)]
  );
  res.json(
    withSkills.map((p) => ({ ...p, members: members.filter((m) => m.team_post_id === p.team_post_id) }))
  );
};

exports.closePost = async (req, res) => {
  const postId = toId(req.params.id);
  if (!postId) return res.status(400).json({ error: 'Invalid post id' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      "UPDATE team_posts SET status = 'closed' WHERE team_post_id = ? AND creator_id = ?",
      [postId, req.user.id]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Team post not found' });
    }
    await conn.query(
      "UPDATE team_requests SET status = 'declined' WHERE team_post_id = ? AND status = 'pending'",
      [postId]
    );
    await conn.commit();
    res.json({ message: 'Team closed' });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    throw err;
  } finally {
    conn.release();
  }
};

// ------------------------------------------------------------------
// Ranked candidates for a post (owner only)
// ------------------------------------------------------------------
exports.getMatches = async (req, res) => {
  const me = req.user.id;
  const postId = toId(req.params.id);
  if (!postId) return res.status(400).json({ error: 'Invalid post id' });

  const [posts] = await db.query(
    'SELECT team_post_id, creator_id, event_id FROM team_posts WHERE team_post_id = ?',
    [postId]
  );
  if (posts.length === 0 || posts[0].creator_id !== me) return res.status(404).json({ error: 'Team post not found' });
  const eventId = posts[0].event_id;
  if (!eventId) return res.json([]); // legacy posts with no event are not matched

  const [required] = await db.query(
    `SELECT s.skill_id, s.skill_name FROM team_post_skills tps
     JOIN skills s ON s.skill_id = tps.skill_id WHERE tps.team_post_id = ?`,
    [postId]
  );
  if (required.length === 0) return res.json([]);

  // Same college, registered for this event, has at least one required skill,
  // not already a member/requested
  const [rows] = await db.query(
    `SELECT u.id, u.fullname, u.reg_no, u.course, u.enrolledyear, us.skill_id, us.level
     FROM user u
     JOIN user_skills us ON us.user_id = u.id
     WHERE us.skill_id IN (?)
       AND u.id <> ?
       AND u.collegeid = (SELECT collegeid FROM user WHERE id = ?)
       AND u.id NOT IN (SELECT user_id FROM team_members  WHERE team_post_id = ?)
       AND u.id NOT IN (SELECT user_id FROM team_requests WHERE team_post_id = ?)
       AND u.id IN (SELECT user_id FROM event_registrations WHERE event_id = ?)`,
    [required.map((r) => r.skill_id), me, me, postId, postId, eventId]
  );

  const candidates = new Map();
  for (const r of rows) {
    if (!candidates.has(r.id)) {
      candidates.set(r.id, {
        id: r.id, fullname: r.fullname, reg_no: r.reg_no, course: r.course,
        enrolledyear: r.enrolledyear, levels: new Map(),
      });
    }
    candidates.get(r.id).levels.set(r.skill_id, r.level);
  }
  if (candidates.size === 0) return res.json([]);
  const ids = [...candidates.keys()];

  const [friendRows] = await db.query(
    `SELECT user_id, friend_user_id FROM friends
     WHERE status = 'accepted' AND (user_id = ? OR friend_user_id = ?)`,
    [me, me]
  );
  const friendSet = new Set(friendRows.map((f) => (f.user_id === me ? f.friend_user_id : f.user_id)));

  const [shared] = await db.query(
    `SELECT cm.user_id, COUNT(*) AS n
     FROM community_members cm
     JOIN community_members mine ON mine.community_id = cm.community_id AND mine.user_id = ?
     WHERE cm.user_id IN (?) GROUP BY cm.user_id`,
    [me, ids]
  );
  const sharedMap = new Map(shared.map((s) => [s.user_id, Number(s.n)]));

  const result = ids
    .map((id) => {
      const c = candidates.get(id);
      const { matched, missing, coverage } = skillCoverage(required, c.levels);
      const isFriend = friendSet.has(id) ? 1 : 0;
      const sharedCount = sharedMap.get(id) || 0;
      const score = Math.round(100 * (0.7 * coverage + 0.2 * isFriend + 0.1 * (Math.min(sharedCount, 3) / 3)));

      const reasons = [`Covers ${matched.length} of ${required.length} required skills`];
      if (isFriend) reasons.push('Already your friend');
      if (sharedCount) reasons.push(`${sharedCount} shared communit${sharedCount > 1 ? 'ies' : 'y'}`);

      return {
        id: c.id, fullname: c.fullname, reg_no: c.reg_no, course: c.course, enrolledyear: c.enrolledyear,
        score,
        skill_match_pct: Math.round(coverage * 100),
        matched_skills: matched.map((s) => s.skill_name),
        missing_skills: missing.map((s) => s.skill_name),
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  res.json(result);
};

// ------------------------------------------------------------------
// Invites / applications
// ------------------------------------------------------------------
async function loadOpenPost(postId) {
  const [rows] = await db.query(
    `SELECT p.team_post_id, p.creator_id, p.team_size, p.status, p.deadline, p.event_id, u.collegeid,
            (SELECT COUNT(*) FROM team_members m WHERE m.team_post_id = p.team_post_id) AS member_count
     FROM team_posts p JOIN user u ON u.id = p.creator_id
     WHERE p.team_post_id = ?`,
    [postId]
  );
  const p = rows[0];
  if (!p) throw httpError(404, 'Team post not found');
  const today = localToday();
  const deadlineStr = p.deadline instanceof Date
    ? `${p.deadline.getFullYear()}-${String(p.deadline.getMonth() + 1).padStart(2, '0')}-${String(p.deadline.getDate()).padStart(2, '0')}`
    : String(p.deadline).slice(0, 10);
  if (p.status !== 'open' || deadlineStr < today) throw httpError(409, 'This team is no longer recruiting');
  if (Number(p.member_count) >= p.team_size) throw httpError(409, 'This team is already full');
  return p;
}

// Owner invites a matched student, with a personal message
exports.invite = async (req, res) => {
  const me = req.user.id;
  const postId = toId(req.params.id);
  const target = toId(req.body.user_id);
  const message = str(req.body.message);
  if (!postId || !target) return res.status(400).json({ error: 'Valid post id and user_id are required' });
  if (!message || message.length > 500) return res.status(400).json({ error: 'Write a short message (max 500 characters)' });
  if (target === me) return res.status(400).json({ error: 'You cannot invite yourself' });

  const post = await loadOpenPost(postId);
  if (post.creator_id !== me) return res.status(403).json({ error: 'Only the team owner can invite' });

  const [users] = await db.query('SELECT id, collegeid FROM user WHERE id = ?', [target]);
  if (users.length === 0 || users[0].collegeid !== post.collegeid) {
    return res.status(404).json({ error: 'Student not found in your college' });
  }
  if (post.event_id && !(await isRegistered(post.event_id, target))) {
    return res.status(400).json({ error: 'This student has not registered for the event' });
  }

  try {
    await db.query(
      "INSERT INTO team_requests (team_post_id, user_id, kind, message) VALUES (?, ?, 'invite', ?)",
      [postId, target, message]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'This student already has a request for this team' });
    throw err;
  }
  res.status(201).json({ message: 'Invite sent' });
};

// Student applies to someone's team
exports.apply = async (req, res) => {
  const me = req.user.id;
  const postId = toId(req.params.id);
  const message = str(req.body.message);
  if (!postId) return res.status(400).json({ error: 'Invalid post id' });
  if (message.length > 500) return res.status(400).json({ error: 'Message is too long (max 500 characters)' });

  const post = await loadOpenPost(postId);
  if (post.creator_id === me) return res.status(400).json({ error: 'You own this team' });
  if (post.collegeid !== (await getCollegeId(me))) return res.status(403).json({ error: 'This team belongs to another college' });
  if (post.event_id && !(await isRegistered(post.event_id, me))) {
    return res.status(403).json({ error: 'Register for this event before applying' });
  }

  try {
    await db.query(
      "INSERT INTO team_requests (team_post_id, user_id, kind, message) VALUES (?, ?, 'apply', ?)",
      [postId, me, message]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'You already have a request for this team' });
    throw err;
  }
  res.status(201).json({ message: 'Application sent' });
};

exports.getInbox = async (req, res) => {
  const me = req.user.id;

  const [invites] = await db.query(
    `SELECT r.request_id, r.message, r.created_at, p.team_post_id, p.title, p.event_name, p.event_type,
            p.deadline, u.fullname AS other_name, u.course AS other_course
     FROM team_requests r
     JOIN team_posts p ON p.team_post_id = r.team_post_id
     JOIN user u ON u.id = p.creator_id
     WHERE r.user_id = ? AND r.kind = 'invite' AND r.status = 'pending' AND p.status = 'open'
     ORDER BY r.created_at DESC`,
    [me]
  );

  const [applications] = await db.query(
    `SELECT r.request_id, r.message, r.created_at, p.team_post_id, p.title, p.event_name,
            u.fullname AS other_name, u.course AS other_course, u.reg_no AS other_reg_no,
            (SELECT GROUP_CONCAT(s.skill_name ORDER BY s.skill_name SEPARATOR ', ')
               FROM user_skills us JOIN skills s ON s.skill_id = us.skill_id
              WHERE us.user_id = r.user_id) AS skills
     FROM team_requests r
     JOIN team_posts p ON p.team_post_id = r.team_post_id
     JOIN user u ON u.id = r.user_id
     WHERE p.creator_id = ? AND r.kind = 'apply' AND r.status = 'pending' AND p.status = 'open'
     ORDER BY r.created_at DESC`,
    [me]
  );

  const [sent] = await db.query(
    `SELECT r.request_id, r.kind, r.status, r.created_at, p.title, u.fullname AS other_name
     FROM team_requests r
     JOIN team_posts p ON p.team_post_id = r.team_post_id
     JOIN user u ON u.id = CASE WHEN r.kind = 'invite' THEN r.user_id ELSE p.creator_id END
     WHERE (r.kind = 'invite' AND p.creator_id = ?) OR (r.kind = 'apply' AND r.user_id = ?)
     ORDER BY r.created_at DESC LIMIT 50`,
    [me, me]
  );

  res.json({ invites, applications, sent });
};

// Invite -> decided by the invited student. Application -> decided by the team owner.
// The post row is locked so two simultaneous accepts cannot overfill a team.
const respond = (action) => async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid request id' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT r.request_id, r.team_post_id, r.user_id, r.kind, r.status,
              p.creator_id, p.team_size, p.status AS post_status
       FROM team_requests r
       JOIN team_posts p ON p.team_post_id = r.team_post_id
       WHERE r.request_id = ? FOR UPDATE`,
      [id]
    );
    const r = rows[0];
    const decider = r && (r.kind === 'invite' ? r.user_id : r.creator_id);
    if (!r || decider !== req.user.id) throw httpError(404, 'Request not found');
    if (r.status !== 'pending') throw httpError(409, 'This request was already handled');

    if (action === 'decline') {
      await conn.query("UPDATE team_requests SET status = 'declined' WHERE request_id = ?", [id]);
    } else {
      if (r.post_status !== 'open') throw httpError(409, 'This team is closed');
      const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM team_members WHERE team_post_id = ?', [r.team_post_id]);
      if (n >= r.team_size) throw httpError(409, 'This team is already full');

      await conn.query('INSERT INTO team_members (team_post_id, user_id) VALUES (?, ?)', [r.team_post_id, r.user_id]);
      await conn.query("UPDATE team_requests SET status = 'accepted' WHERE request_id = ?", [id]);
      if (n + 1 >= r.team_size) {
        await conn.query("UPDATE team_posts SET status = 'closed' WHERE team_post_id = ?", [r.team_post_id]);
        await conn.query(
          "UPDATE team_requests SET status = 'declined' WHERE team_post_id = ? AND status = 'pending'",
          [r.team_post_id]
        );
      }
    }
    await conn.commit();
    res.json({ message: action === 'accept' ? 'Accepted' : 'Declined' });
  } catch (err) {
    try { await conn.rollback(); } catch (_) { /* nothing to roll back */ }
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Already a team member' });
    throw err;
  } finally {
    conn.release();
  }
};

exports.acceptRequest = respond('accept');
exports.declineRequest = respond('decline');