const express = require('express');
const cors = require('cors');
const path=require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); 
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);
const postsRoutes = require('./routes/posts');
app.use('/api/posts', postsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
