const router = require('express').Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const c = require('../controllers/eventController');

router.use(auth);

// any signed-in role (college-scoped)
router.get('/', requireRole('student', 'staff', 'admin'), c.listEvents);

// students
router.post('/:id/register', requireRole('student'), c.register);
router.delete('/:id/register', requireRole('student'), c.unregister);

// staff  (/staff/mine must stay in this order relative to other staff routes)
router.post('/staff', requireRole('staff'), c.createEvent);
router.get('/staff/mine', requireRole('staff'), c.myEvents);

// admin
router.get('/admin/pending', requireRole('admin'), c.pendingEvents);
router.patch('/admin/:id/review', requireRole('admin'), c.reviewEvent);
router.put('/admin/users/:id/role', requireRole('admin'), c.setUserRole);

module.exports = router;