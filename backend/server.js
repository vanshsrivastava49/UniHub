const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const postsRoutes = require('./routes/posts');
const communityRoutes = require('./routes/community');
const friendsRoutes = require('./routes/friends');
const chatRoutes=require('./routes/chats')
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/friends',friendsRoutes);
app.use('/api/chats',chatRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
