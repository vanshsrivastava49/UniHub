const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for all domains
app.use(cors({ origin: '*' }));

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import route files
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const postsRoutes = require('./routes/posts');
const communityRoutes = require('./routes/community');
const friendsRoutes = require('./routes/friends');
const chatRoutes=require('./routes/chats')
// Use routes with appropriate URL prefixes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/friends',friendsRoutes);
app.use('/api/chats',chatRoutes);
// Default port setup (using process.env.PORT or 5000 as fallback)
const PORT = process.env.PORT || 5000;

// Start the server and log the running status
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
