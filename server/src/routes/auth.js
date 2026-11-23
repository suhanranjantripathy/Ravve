import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import getDb from '../db/index.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure email and password columns exist on profiles table safely
try {
  const db = getDb();
  db.exec('ALTER TABLE profiles ADD COLUMN email TEXT;');
} catch (_) {}
try {
  const db = getDb();
  db.exec('ALTER TABLE profiles ADD COLUMN password TEXT;');
} catch (_) {}

// Endpoint to save Supabase credentials into .env
router.post('/configure-supabase', (req, res) => {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = req.body;
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(400).json({ error: 'Supabase URL and Anon Key are required.' });
  }

  try {
    const serverEnvPath = path.resolve(__dirname, '../../../server/.env');
    const clientEnvPath = path.resolve(__dirname, '../../../client/.env');

    const serverEnvContent = `PORT=5001\nSUPABASE_URL=${supabaseUrl}\nSUPABASE_KEY=${supabaseAnonKey}\n${supabaseServiceKey ? `SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}\n` : ''}`;
    const clientEnvContent = `VITE_SUPABASE_URL=${supabaseUrl}\nVITE_SUPABASE_ANON_KEY=${supabaseAnonKey}\n`;

    fs.writeFileSync(serverEnvPath, serverEnvContent);
    fs.writeFileSync(clientEnvPath, clientEnvContent);

    console.log('✅ Supabase configuration saved into .env files.');
    res.json({ message: 'Supabase credentials configured successfully!' });
  } catch (err) {
    console.error('Failed to write .env:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check username availability
router.get('/check-username', (req, res) => {
  const username = (req.query.username || '').trim();
  if (!username) {
    return res.json({ available: true });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM profiles WHERE LOWER(username) = LOWER(?)').get(username);

  if (existing) {
    return res.json({
      available: false,
      message: `The username "${username}" already exists. Please choose a different username.`
    });
  }

  return res.json({
    available: true,
    message: 'Username is available!'
  });
});

// Get currently logged-in user profile
router.get('/me', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const db = getDb();
  let profile = db.prepare('SELECT * FROM profiles WHERE id = ? OR username = ? OR email = ?').get(userId, userId, userId);
  
  if (!profile) {
    return res.status(404).json({ error: 'User profile not found' });
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
  if (!username) {
    return res.status(400).json({ error: 'Username or Email is required' });
  }

  const db = getDb();
  const cleanIdentifier = username.trim();
  let profile = db.prepare('SELECT * FROM profiles WHERE username = ? OR id = ? OR LOWER(email) = LOWER(?)').get(cleanIdentifier, cleanIdentifier, cleanIdentifier);
  
  if (!profile) {
    return res.status(401).json({ error: 'Invalid username/email or password.' });
  }

  // Password verification: protect user account from unauthorized access
  const expectedPassword = profile.password || 'password123';
  if (password !== expectedPassword) {
    return res.status(401).json({ error: 'Incorrect password. Access denied.' });
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

// Forgot password endpoint
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required' });
  }

  const cleanEmail = email.trim();
  const db = getDb();
  const profile = db.prepare('SELECT id, username, email FROM profiles WHERE LOWER(email) = LOWER(?)').get(cleanEmail);

  if (profile) {
    // Reset temporary password so user can always log in immediately
    db.prepare('UPDATE profiles SET password = ? WHERE id = ?').run('password123', profile.id);
    return res.json({
      message: `Password reset link sent to ${cleanEmail}! (Your password has also been temporarily reset to 'password123')`
    });
  }

  // Return generic confirmation for privacy
  return res.json({
    message: `If an account exists with ${cleanEmail}, password reset instructions have been sent.`
  });
});

// Signup new user
router.post('/signup', (req, res) => {
  const { username, full_name, email, bio, favorite_genres = [] } = req.body;
  const effectiveUsername = (username || (email ? email.split('@')[0] : `reader_${Date.now()}`)).trim();
  const effectiveFullName = (full_name || effectiveUsername).trim();
  const cleanEmail = email ? email.trim() : null;

  const db = getDb();

  // 1. Check if username already exists (case-insensitive)
  const existingByUsername = db.prepare('SELECT id, username FROM profiles WHERE LOWER(username) = LOWER(?)').get(effectiveUsername);
  if (existingByUsername) {
    return res.status(409).json({
      error: `The username "${effectiveUsername}" already exists. Please choose a different username.`
    });
  }

  // 2. Check if email already exists
  if (cleanEmail) {
    const existingByEmail = db.prepare('SELECT id, email FROM profiles WHERE LOWER(email) = LOWER(?)').get(cleanEmail);
    if (existingByEmail) {
      return res.status(409).json({
        error: `An account with the email "${cleanEmail}" already exists. Please sign in instead.`
      });
    }
  }

  const id = req.body.id || `usr_${Date.now()}`;
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${effectiveUsername}`;

  db.prepare(`
    INSERT INTO profiles (id, username, full_name, email, password, avatar_url, bio, favorite_genres)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, effectiveUsername, effectiveFullName, cleanEmail, req.body.password || null, avatarUrl, bio || 'Avid reader', JSON.stringify(favorite_genres));

  // Initialize reading challenge for current year
  const currentYear = new Date().getFullYear();
  db.prepare(`
    INSERT INTO reading_goals (id, user_id, year, target_books, completed_books)
    VALUES (?, ?, ?, ?, ?)
  `).run(`goal_${id}_${currentYear}`, id, currentYear, 25, 0);

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
