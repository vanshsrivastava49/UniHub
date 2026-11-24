const db = require('../models/db');

const CATEGORIES = ['academic', 'cultural', 'sports', 'technical', 'other'];
const ROLES = ['student', 'staff', 'admin'];

const httpError = (status, message) => Object.assign(new Error(message), { status });
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const toId = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const localToday = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

// ---------- Students and everyone signed in (same college only) ----------

// Approved, upcoming events in my college
exports.listEvents = async (req, res) => {
  const [rows] = await db.query(
    `SELECT e.event_id, e.title, e.description, e.category, e.venue, e.event_date, e.event_time,
            e.image_url, e.allows_teams,
            (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.event_id) AS registration_count,
            EXISTS (SELECT 1 FROM event_registrations r
                    WHERE r.event_id = e.event_id AND r.user_id = ?) AS is_registered
     FROM events e
     WHERE e.collegeid = ? AND e.status = 'approved' AND e.event_date >= CURDATE()
     ORDER BY e.event_date ASC`,
    [req.user.id, req.user.collegeid]
  );
  res.json(rows);
};

// Student registers for an event
exports.register = async (req, res) => {
  const eventId = toId(req.params.id);
  if (!eventId) throw httpError(400, 'Invalid event id');

  const [rows] = await db.query(
    'SELECT collegeid, status, event_date FROM events WHERE event_id = ?',
    [eventId]
  );
  const ev = rows[0];
  if (!ev || ev.collegeid !== req.user.collegeid || ev.status !== 'approved') {
    throw httpError(404, 'Event not found');
  }
  if (String(ev.event_date).slice(0, 10) < localToday()) {
    throw httpError(409, 'This event has already taken place');
  }

  try {
    await db.query('INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)', [eventId, req.user.id]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw httpError(409, 'You are already registered for this event');
    throw err;
  }
  res.status(201).json({ message: 'Registered for event' });
};

// Student cancels a registration
exports.unregister = async (req, res) => {
  const eventId = toId(req.params.id);
  if (!eventId) throw httpError(400, 'Invalid event id');

  const [result] = await db.query(
    'DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?',
    [eventId, req.user.id]
  );
  if (result.affectedRows === 0) throw httpError(404, 'You are not registered for this event');
  res.json({ message: 'Registration cancelled' });
};

// ---------- Staff ----------

// Staff submits an event; it stays pending until an admin approves it
exports.createEvent = async (req, res) => {
  const b = req.body || {};
  const title = str(b.title);
  const description = str(b.description);
  const category = str(b.category).toLowerCase() || 'other';
  const venue = str(b.venue);
  const event_date = str(b.event_date);
  const event_time = str(b.event_time) || null;
  const image_url = str(b.image_url) || null;
  const allows_teams = [true, 1, '1', 'true'].includes(b.allows_teams) ? 1 : 0;

  if (title.length < 3 || title.length > 100) throw httpError(400, 'Title must be 3-100 characters');
  if (description.length > 2000) throw httpError(400, 'Description is too long (max 2000 characters)');
  if (!CATEGORIES.includes(category)) throw httpError(400, 'Invalid category');
  if (venue.length > 150) throw httpError(400, 'Venue is too long (max 150 characters)');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) throw httpError(400, 'Event date must be YYYY-MM-DD');
  if (event_date < localToday()) throw httpError(400, 'Event date cannot be in the past');
  if (event_time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(event_time)) {
    throw httpError(400, 'Event time must be HH:MM');
  }
  if (image_url && (image_url.length > 255 || !/^https?:\/\//.test(image_url))) {
    throw httpError(400, 'Image must be a valid http(s) URL');
  }

  const [result] = await db.query(
    `INSERT INTO events (collegeid, created_by, title, description, category, venue,
                         event_date, event_time, image_url, allows_teams, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [req.user.collegeid, req.user.id, title, description || null, category, venue || null,
     event_date, event_time, image_url, allows_teams]
  );
  res.status(201).json({ message: 'Event submitted for approval', event_id: result.insertId });
};

// Events this staff member created, with their status
exports.myEvents = async (req, res) => {
  const [rows] = await db.query(
    `SELECT e.event_id, e.title, e.category, e.event_date, e.status, e.allows_teams, e.reviewed_at,
            (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id = e.event_id) AS registration_count
     FROM events e
     WHERE e.created_by = ?
     ORDER BY e.created_at DESC`,
    [req.user.id]
  );
  res.json(rows);
};

// ---------- Admin ----------

// Pending events from my college
exports.pendingEvents = async (req, res) => {
  const [rows] = await db.query(
    `SELECT e.event_id, e.title, e.description, e.category, e.venue, e.event_date, e.event_time,
            e.image_url, e.allows_teams, e.created_at, u.fullname AS created_by_name
     FROM events e
     JOIN user u ON u.id = e.created_by
     WHERE e.collegeid = ? AND e.status = 'pending'
     ORDER BY e.created_at ASC`,
    [req.user.collegeid]
  );
  res.json(rows);
};

// Approve or reject a pending event
exports.reviewEvent = async (req, res) => {
  const id = toId(req.params.id);
  const action = str(req.body?.action);
  if (!id) throw httpError(400, 'Invalid event id');
  if (!['approve', 'reject'].includes(action)) {
    throw httpError(400, "Action must be 'approve' or 'reject'");
  }

  const next = action === 'approve' ? 'approved' : 'rejected';
  const [result] = await db.query(
    `UPDATE events
     SET status = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE event_id = ? AND collegeid = ? AND status = 'pending'`,
    [next, req.user.id, id, req.user.collegeid]
  );
  if (result.affectedRows === 0) throw httpError(404, 'Pending event not found');
  res.json({ message: `Event ${next}` });
};

// Admin assigns a role to a user in the same college
exports.setUserRole = async (req, res) => {
  const id = toId(req.params.id);
  const role = str(req.body?.role);
  if (!id) throw httpError(400, 'Invalid user id');
  if (!ROLES.includes(role)) throw httpError(400, 'Role must be student, staff or admin');
  if (id === req.user.id) throw httpError(400, 'You cannot change your own role');

  const [result] = await db.query(
    'UPDATE user SET role = ? WHERE id = ? AND collegeid = ?',
    [role, id, req.user.collegeid]
  );
  if (result.affectedRows === 0) throw httpError(404, 'User not found in your college');
  res.json({ message: 'Role updated' });
};