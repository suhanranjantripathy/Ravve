import { Router } from 'express';
import getDb from '../db/index.js';

const router = Router();

// Get reviews for a specific book
router.get('/book/:bookId', (req, res) => {
  const { bookId } = req.params;
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const { sort = 'helpful' } = req.query;
  const db = getDb();

  let orderBy = 'r.likes_count DESC, r.created_at DESC';
  if (sort === 'latest') orderBy = 'r.created_at DESC';
  else if (sort === 'rating_high') orderBy = 'r.rating DESC';
  else if (sort === 'rating_low') orderBy = 'r.rating ASC';

  const reviews = db.prepare(`
    SELECT r.*, p.username, p.full_name, p.avatar_url,
      EXISTS(SELECT 1 FROM review_likes rl WHERE rl.review_id = r.id AND rl.user_id = ?) as user_has_liked
    FROM reviews r
    JOIN profiles p ON r.user_id = p.id
    WHERE r.book_id = ?
    ORDER BY ${orderBy}
  `).all(currentUserId, bookId);

  // Fetch comments for all these reviews
  const reviewIds = reviews.map(r => r.id);
  let commentsMap = {};
  if (reviewIds.length > 0) {
    const comments = db.prepare(`
      SELECT c.*, p.username, p.full_name, p.avatar_url
      FROM comments c
      JOIN profiles p ON c.user_id = p.id
      WHERE c.review_id IN (${reviewIds.map(() => '?').join(',')})
      ORDER BY c.created_at ASC
    `).all(...reviewIds);

    for (const c of comments) {
      if (!commentsMap[c.review_id]) commentsMap[c.review_id] = [];
      commentsMap[c.review_id].push(c);
    }
  }

  const enriched = reviews.map(r => ({
    ...r,
    user_has_liked: Boolean(r.user_has_liked),
    comments: commentsMap[r.id] || []
  }));

  res.json({ reviews: enriched });
});

// Create or update a review
router.post('/', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { book_id, rating, title = '', content, has_spoilers = false } = req.body;

  if (!book_id || !rating || !content) {
    return res.status(400).json({ error: 'book_id, rating (1-5), and content are required' });
  }

  const db = getDb();
  const id = `rev_${Date.now()}`;

  // Execute review creation / update and update book average rating
  const reviewTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO reviews (id, user_id, book_id, rating, title, content, has_spoilers)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, book_id) DO UPDATE SET
        rating = excluded.rating,
        title = excluded.title,
        content = excluded.content,
        has_spoilers = excluded.has_spoilers,
        updated_at = CURRENT_TIMESTAMP
    `).run(id, userId, book_id, rating, title, content, has_spoilers ? 1 : 0);

    // Update user_books rating too
    db.prepare(`
      UPDATE user_books 
      SET user_rating = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND book_id = ?
    `).run(rating, userId, book_id);

    // Recalculate book average_rating and ratings_count
    const stats = db.prepare(`
      SELECT COUNT(*) as cnt, AVG(rating) as avg_r 
      FROM reviews 
      WHERE book_id = ?
    `).get(book_id);

    db.prepare(`
      UPDATE books 
      SET average_rating = ?, ratings_count = ? 
      WHERE id = ?
    `).run(Math.round(stats.avg_r * 100) / 100, stats.cnt, book_id);

    // Post to activity feed
    db.prepare(`
      INSERT INTO activity_feed (id, user_id, action_type, book_id, review_id, details)
      VALUES (?, ?, 'reviewed_book', ?, ?, ?)
    `).run(`act_${Date.now()}`, userId, book_id, id, JSON.stringify({ rating, title }));
  });

  reviewTx();

  const savedReview = db.prepare(`
    SELECT r.*, p.username, p.full_name, p.avatar_url 
    FROM reviews r 
    JOIN profiles p ON r.user_id = p.id 
    WHERE r.book_id = ? AND r.user_id = ?
  `).get(book_id, userId);

  res.status(201).json({ message: 'Review saved successfully', review: savedReview });
});

// Delete a review
router.delete('/:id', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { id } = req.params;
  const db = getDb();

  const review = db.prepare('SELECT book_id FROM reviews WHERE id = ? AND user_id = ?').get(id, userId);
  if (!review) {
    return res.status(404).json({ error: 'Review not found or unauthorized' });
  }

  const deleteTx = db.transaction(() => {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id);

    // Recalculate book stats
    const stats = db.prepare('SELECT COUNT(*) as cnt, AVG(rating) as avg_r FROM reviews WHERE book_id = ?').get(review.book_id);
    db.prepare('UPDATE books SET average_rating = ?, ratings_count = ? WHERE id = ?').run(stats.avg_r ? Math.round(stats.avg_r * 100) / 100 : 0.0, stats.cnt, review.book_id);
  });

  deleteTx();
  res.json({ message: 'Review deleted successfully' });
});

// Like / Unlike review
router.post('/:id/like', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { id } = req.params;
  const db = getDb();

  const existing = db.prepare('SELECT 1 FROM review_likes WHERE review_id = ? AND user_id = ?').get(id, userId);

  const likeTx = db.transaction(() => {
    if (existing) {
      db.prepare('DELETE FROM review_likes WHERE review_id = ? AND user_id = ?').run(id, userId);
      db.prepare('UPDATE reviews SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(id);
    } else {
      db.prepare('INSERT INTO review_likes (id, user_id, review_id) VALUES (?, ?, ?)').run(`rl_${Date.now()}`, userId, id);
      db.prepare('UPDATE reviews SET likes_count = likes_count + 1 WHERE id = ?').run(id);

      // Create notification for review owner if different from liker
      const review = db.prepare('SELECT user_id, book_id FROM reviews WHERE id = ?').get(id);
      if (review && review.user_id !== userId) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
          VALUES (?, ?, ?, 'review_like', ?, 'Someone liked your review')
        `).run(`notif_${Date.now()}`, review.user_id, userId, id);
      }
    }
  });

  likeTx();

  const currentCount = db.prepare('SELECT likes_count FROM reviews WHERE id = ?').get(id)?.likes_count || 0;
  res.json({ liked: !existing, likes_count: currentCount });
});

// Comment on a review
router.post('/:id/comment', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { id } = req.params;
  const { content, parent_comment_id = null } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  const db = getDb();
  const commentId = `cmt_${Date.now()}`;

  db.prepare(`
    INSERT INTO comments (id, user_id, review_id, parent_comment_id, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(commentId, userId, id, parent_comment_id, content.trim());

  // Notify review owner
  const review = db.prepare('SELECT user_id FROM reviews WHERE id = ?').get(id);
  if (review && review.user_id !== userId) {
    db.prepare(`
      INSERT INTO notifications (id, user_id, actor_id, type, entity_id, message)
      VALUES (?, ?, ?, 'review_comment', ?, 'Someone commented on your review')
    `).run(`notif_${Date.now()}`, review.user_id, userId, id);
  }

  const newComment = db.prepare(`
    SELECT c.*, p.username, p.full_name, p.avatar_url
    FROM comments c
    JOIN profiles p ON c.user_id = p.id
    WHERE c.id = ?
  `).get(commentId);

  res.status(201).json({ comment: newComment });
});

export default router;
