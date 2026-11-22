import { Router } from 'express';
import getDb from '../db/index.js';

const router = Router();

// Get profile by username
router.get('/:username', (req, res) => {
  const { username } = req.params;
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const db = getDb();

  const profile = db.prepare('SELECT * FROM profiles WHERE username = ? OR id = ?').get(username, username);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Follow counts and status
  const followersCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?').get(profile.id).count;
  const followingCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?').get(profile.id).count;
  
  const isFollowing = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, profile.id) ? true : false;

  // Reading statistics summary
  const booksReadCount = db.prepare("SELECT COUNT(*) as count FROM user_books WHERE user_id = ? AND shelf_type = 'read'").get(profile.id).count;
  const currentlyReadingCount = db.prepare("SELECT COUNT(*) as count FROM user_books WHERE user_id = ? AND shelf_type = 'currently_reading'").get(profile.id).count;
  const wantToReadCount = db.prepare("SELECT COUNT(*) as count FROM user_books WHERE user_id = ? AND shelf_type = 'want_to_read'").get(profile.id).count;
  const totalReviewsCount = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE user_id = ?').get(profile.id).count;

  // Current reading book details
  const currentlyReadingBooks = db.prepare(`
    SELECT b.*, ub.current_page, ub.total_pages, ub.start_date, ub.personal_notes
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    WHERE ub.user_id = ? AND ub.shelf_type = 'currently_reading'
    ORDER BY ub.updated_at DESC
    LIMIT 3
  `).all(profile.id);

  // Recent reviews by user
  const recentReviews = db.prepare(`
    SELECT r.*, b.title as book_title, b.author as book_author, b.cover_url as book_cover
    FROM reviews r
    JOIN books b ON r.book_id = b.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT 5
  `).all(profile.id);

  // Custom shelves
  const customShelves = db.prepare('SELECT * FROM shelves WHERE user_id = ?').all(profile.id);

  res.json({
    profile: {
      ...profile,
      reading_interests: JSON.parse(profile.reading_interests || '[]'),
      favorite_genres: JSON.parse(profile.favorite_genres || '[]'),
      favorite_books: JSON.parse(profile.favorite_books || '[]'),
      favorite_authors: JSON.parse(profile.favorite_authors || '[]'),
      stats: {
        books_read: booksReadCount,
        currently_reading: currentlyReadingCount,
        want_to_read: wantToReadCount,
        total_reviews: totalReviewsCount,
        followers_count: followersCount,
        following_count: followingCount,
        is_following: isFollowing
      },
      currently_reading_books: currentlyReadingBooks,
      recent_reviews: recentReviews,
      custom_shelves: customShelves
    }
  });
});

// Update profile
router.put('/', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const {
    full_name,
    avatar_url,
    bio,
    reading_interests,
    favorite_genres,
    favorite_books,
    favorite_authors,
    currently_reading_status,
    is_public
  } = req.body;

  const db = getDb();
  
  const updateStmt = db.prepare(`
    UPDATE profiles SET
      full_name = COALESCE(?, full_name),
      avatar_url = COALESCE(?, avatar_url),
      bio = COALESCE(?, bio),
      reading_interests = COALESCE(?, reading_interests),
      favorite_genres = COALESCE(?, favorite_genres),
      favorite_books = COALESCE(?, favorite_books),
      favorite_authors = COALESCE(?, favorite_authors),
      currently_reading_status = COALESCE(?, currently_reading_status),
      is_public = COALESCE(?, is_public),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  updateStmt.run(
    full_name,
    avatar_url,
    bio,
    reading_interests ? JSON.stringify(reading_interests) : null,
    favorite_genres ? JSON.stringify(favorite_genres) : null,
    favorite_books ? JSON.stringify(favorite_books) : null,
    favorite_authors ? JSON.stringify(favorite_authors) : null,
    currently_reading_status,
    is_public !== undefined ? (is_public ? 1 : 0) : null,
    currentUserId
  );

  const updated = db.prepare('SELECT * FROM profiles WHERE id = ?').get(currentUserId);
  res.json({
    message: 'Profile updated successfully',
    profile: {
      ...updated,
      reading_interests: JSON.parse(updated.reading_interests || '[]'),
      favorite_genres: JSON.parse(updated.favorite_genres || '[]'),
      favorite_books: JSON.parse(updated.favorite_books || '[]'),
      favorite_authors: JSON.parse(updated.favorite_authors || '[]'),
    }
  });
});

export default router;
