import { Router } from 'express';
import getDb from '../db/index.js';

const router = Router();

// Demo users list for quick testing/evaluation
router.get('/demo-users', (req, res) => {
  const db = getDb();
  const profiles = db.prepare('SELECT id, username, full_name, avatar_url, bio, currently_reading_status FROM profiles').all();
  res.json({ users: profiles });
});

// Get currently logged-in user profile
router.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena'; // default to Elena for seamless demo
  const db = getDb();
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(userId);
  
  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      ...profile,
      reading_interests: JSON.parse(profile.reading_interests || '[]'),
      favorite_genres: JSON.parse(profile.favorite_genres || '[]'),
      favorite_books: JSON.parse(profile.favorite_books || '[]'),
      favorite_authors: JSON.parse(profile.favorite_authors || '[]'),
    }
  });
});

// Login (email/username + password)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();

  let profile = db.prepare('SELECT * FROM profiles WHERE username = ? OR id = ?').get(username, username);
  
  // If user doesn't exist, create a guest or return error
  if (!profile) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.json({
    message: 'Login successful',
    user: {
      ...profile,
      reading_interests: JSON.parse(profile.reading_interests || '[]'),
      favorite_genres: JSON.parse(profile.favorite_genres || '[]'),
      favorite_books: JSON.parse(profile.favorite_books || '[]'),
      favorite_authors: JSON.parse(profile.favorite_authors || '[]'),
    },
    token: `token_${profile.id}`
  });
});

// Signup new user
router.post('/signup', (req, res) => {
  const { username, full_name, bio, favorite_genres = [] } = req.body;
  if (!username || !full_name) {
    return res.status(400).json({ error: 'Username and Full Name are required' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM profiles WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const id = `usr_${Date.now()}`;
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

  const insert = db.prepare(`
    INSERT INTO profiles (id, username, full_name, avatar_url, bio, favorite_genres)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run(id, username, full_name, avatarUrl, bio || '', JSON.stringify(favorite_genres));

  // Initialize reading challenge for current year
  const currentYear = new Date().getFullYear();
  db.prepare(`
    INSERT INTO reading_goals (id, user_id, year, target_books, completed_books)
    VALUES (?, ?, ?, ?, ?)
  `).run(`goal_${id}_${currentYear}`, id, currentYear, 20, 0);

  const newProfile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      ...newProfile,
      reading_interests: [],
      favorite_genres,
      favorite_books: [],
      favorite_authors: []
    },
    token: `token_${id}`
  });
});

export default router;
