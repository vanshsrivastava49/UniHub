const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/teamController');

router.use(auth);

// skills
router.get('/skills', c.listSkills);
router.post('/skills', c.createSkill);
router.get('/skills/me', c.getMySkills);
router.put('/skills/me', c.setMySkills);

// team posts  (note: /posts/mine must stay above /posts/:id/...)
router.post('/posts', c.createPost);
router.get('/posts', c.listOpenPosts);
router.get('/posts/mine', c.listMyPosts);
router.get('/posts/:id/matches', c.getMatches);
router.post('/posts/:id/invite', c.invite);
router.post('/posts/:id/apply', c.apply);
router.post('/posts/:id/close', c.closePost);

// invites / applications
router.get('/requests', c.getInbox);
router.post('/requests/:id/accept', c.acceptRequest);
router.post('/requests/:id/decline', c.declineRequest);

router.get('/events', c.listTeamEvents);

module.exports = router;