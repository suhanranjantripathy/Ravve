import { Router } from 'express';
import getDb from '../db/index.js';

const router = Router();

// Follow a friend strictly by their username
router.post('/follow-by-username', (req, res) => {
  const currentUserId = req.headers['x-user-id'];
  if (!currentUserId) {
    return res.status(401).json({ error: 'Authentication required to follow friends' });
  }

  const rawUsername = req.body.username || '';
  const cleanUsername = rawUsername.replace(/^@/, '').trim();

  if (!cleanUsername) {
    return res.status(400).json({ error: 'Friend username is required' });
  }

  const db = getDb();
  const friend = db.prepare('SELECT id, username, full_name, avatar_url, bio, currently_reading_status FROM profiles WHERE LOWER(username) = LOWER(?)').get(cleanUsername);

  if (!friend) {
    return res.status(404).json({ error: `User "@${cleanUsername}" was not found. Please verify your friend's username and try again.` });
  }

  if (friend.id === currentUserId) {
    return res.status(400).json({ error: `You cannot follow your own username (@${friend.username}).` });
  }

  const already = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, friend.id);
  if (already) {
    return res.json({
      following: true,
      alreadyFollowing: true,
      message: `You are already following @${friend.username}.`,
      user: friend
    });
  }

  // Insert follow relationship
  db.prepare('INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)').run(`flw_${Date.now()}`, currentUserId, friend.id);

  // Send notification to friend
  const currentProfile = db.prepare('SELECT username, full_name FROM profiles WHERE id = ?').get(currentUserId);
  const followerName = currentProfile?.full_name || `@${currentProfile?.username || 'A reader'}`;
  db.prepare(`
    INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
    VALUES (?, ?, ?, 'follow', ?, ?)
  `).run(`notif_${Date.now()}`, friend.id, currentUserId, currentUserId, `${followerName} started following your reading updates`);

  // Record social activity
  db.prepare(`
    INSERT INTO activity_feed (id, user_id, action_type, details)
    VALUES (?, ?, 'custom_update', ?)
  `).run(`act_${Date.now()}`, currentUserId, JSON.stringify({ text: `Started following @${friend.username}'s reading journey` }));

  return res.status(201).json({
    following: true,
    message: `You are now following @${friend.username}!`,
    user: friend
  });
});

// Unfollow a friend by their username
router.post('/unfollow-by-username', (req, res) => {
  const currentUserId = req.headers['x-user-id'];
  if (!currentUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const rawUsername = req.body.username || '';
  const cleanUsername = rawUsername.replace(/^@/, '').trim();

  const db = getDb();
  const friend = db.prepare('SELECT id, username FROM profiles WHERE LOWER(username) = LOWER(?)').get(cleanUsername);

  if (!friend) {
    return res.status(404).json({ error: `User "@${cleanUsername}" was not found.` });
  }

  db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(currentUserId, friend.id);

  return res.json({
    following: false,
    message: `Unfollowed @${friend.username}.`
  });
});

// Search and preview a friend by username before following
router.get('/user-by-username/:username', (req, res) => {
  const currentUserId = req.headers['x-user-id'];
  const rawUsername = req.params.username || '';
  const cleanUsername = rawUsername.replace(/^@/, '').trim();

  const db = getDb();
  const user = db.prepare(`
    SELECT id, username, full_name, avatar_url, bio, currently_reading_status, is_public
    FROM profiles 
    WHERE LOWER(username) = LOWER(?)
  `).get(cleanUsername);

  if (!user) {
    return res.status(404).json({ error: `User "@${cleanUsername}" was not found` });
  }

  const isFollowing = currentUserId 
    ? Boolean(db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, user.id))
    : false;

  const booksReadCount = db.prepare("SELECT COUNT(*) as count FROM user_books WHERE user_id = ? AND shelf_type = 'read'").get(user.id)?.count || 0;

  return res.json({
    user: {
      ...user,
      is_following: isFollowing,
      books_read: booksReadCount,
      is_self: currentUserId === user.id
    }
  });
});

// Get currently followed friends list for authenticated user
router.get('/my-friends', (req, res) => {
  const currentUserId = req.headers['x-user-id'];
  if (!currentUserId) {
    return res.json({ friends: [] });
  }

  const db = getDb();
  const friends = db.prepare(`
    SELECT p.id, p.username, p.full_name, p.avatar_url, p.bio, p.currently_reading_status
    FROM follows f
    JOIN profiles p ON f.following_id = p.id
    WHERE f.follower_id = ?
    ORDER BY f.created_at DESC
  `).all(currentUserId);

  res.json({ friends });
});

// Follow / Unfollow user (by ID fallback)
router.post('/follow/:targetUserId', (req, res) => {
  const currentUserId = req.headers['x-user-id'];
  if (!currentUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { targetUserId } = req.params;

  if (currentUserId === targetUserId) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, targetUserId);

  if (existing) {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(currentUserId, targetUserId);
    res.json({ following: false, message: 'Unfollowed user' });
  } else {
    db.prepare('INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)').run(`flw_${Date.now()}`, currentUserId, targetUserId);
    
    // Create notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
      VALUES (?, ?, ?, 'follow', ?, 'started following your reading updates')
    `).run(`notif_${Date.now()}`, targetUserId, currentUserId, currentUserId);

    res.json({ following: true, message: 'Followed user' });
  }
});

// Community activity feed (Letterboxd & Goodreads style)
router.get('/feed', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const { filter = 'all', limit = 25 } = req.query;
  const db = getDb();

  let sql = `
    SELECT a.*, 
      p.username, p.full_name, p.avatar_url,
      b.title as book_title, b.author as book_author, b.cover_url as book_cover, b.genre as book_genre,
      r.content as review_content, r.rating as review_rating, r.has_spoilers as review_has_spoilers
    FROM activity_feed a
    JOIN profiles p ON a.user_id = p.id
    LEFT JOIN books b ON a.book_id = b.id
    LEFT JOIN reviews r ON a.review_id = r.id
  `;

  if (filter === 'following') {
    sql += `
      WHERE a.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = ?
      ) OR a.user_id = ?
    `;
  }

  sql += ` ORDER BY a.created_at DESC LIMIT ?`;

  const activities = filter === 'following' 
    ? db.prepare(sql).all(currentUserId, currentUserId, Number(limit))
    : db.prepare(sql).all(Number(limit));

  const parsed = activities.map(act => ({
    ...act,
    details: typeof act.details === 'string' ? JSON.parse(act.details || '{}') : act.details
  }));

  res.json({ activities: parsed });
});

// Like an activity
router.post('/activity/:id/like', (req, res) => {
  const { id } = req.params;
  const db = getDb();

  db.prepare('UPDATE activity_feed SET likes_count = likes_count + 1 WHERE id = ?').run(id);
  const updated = db.prepare('SELECT likes_count FROM activity_feed WHERE id = ?').get(id);

  res.json({ likes_count: updated?.likes_count || 0 });
});

// Share a custom reading status / update
router.post('/post', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { content, book_id = null } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty' });
  }

  const db = getDb();
  const id = `act_${Date.now()}`;

  db.prepare(`
    INSERT INTO activity_feed (id, user_id, action_type, book_id, details)
    VALUES (?, ?, 'custom_update', ?, ?)
  `).run(id, userId, book_id, JSON.stringify({ text: content.trim() }));

  res.status(201).json({ message: 'Update posted successfully' });
});

// "Readers to Follow" suggestions
router.get('/suggestions', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const db = getDb();

  const suggestions = db.prepare(`
    SELECT p.id, p.username, p.full_name, p.avatar_url, p.bio, p.currently_reading_status,
      (SELECT COUNT(*) FROM user_books WHERE user_id = p.id AND shelf_type = 'read') as books_read_count
    FROM profiles p
    WHERE p.id <> ?
      AND p.id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
    LIMIT 4
  `).all(currentUserId, currentUserId);

  res.json({ suggestions });
});

export default router;
