require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Check your .env file.');
  process.exit(1);
}

const app = express();

// CORP must be cross-origin or the frontend (a different port) can't load uploaded images
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  })
);
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/communities', require('./routes/community'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/team', require('./routes/team'));
app.use('/api/events', require('./routes/events'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Central error handler (Express 5 forwards async errors here automatically)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message;
    return res.status(400).json({ error: msg });
  }
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));