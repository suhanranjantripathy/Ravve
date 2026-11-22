import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import getDb from './db/index.js';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import bookRoutes from './routes/books.js';
import userBookRoutes from './routes/userBooks.js';
import shelfRoutes from './routes/shelves.js';
import reviewRoutes from './routes/reviews.js';
import socialRoutes from './routes/social.js';
import goalRoutes from './routes/goals.js';
import statRoutes from './routes/stats.js';
import journalRoutes from './routes/journal.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize DB and ensure tables and initial seed data
try {
  getDb();
  console.log('📖 RAAVE Database initialized and ready.');
} catch (err) {
  console.error('Database initialization error:', err);
}

// API Routes registration
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/user-books', userBookRoutes);
app.use('/api/shelves', shelfRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'RAAVE Backend API', timestamp: new Date().toISOString() });
});

// Serve frontend static build
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 RAAVE Server running smoothly on http://localhost:${PORT}`);
});
