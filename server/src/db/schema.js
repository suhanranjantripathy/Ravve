import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../raave.db');

export function initDatabase() {
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  // 1. PROFILES
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      reading_interests TEXT DEFAULT '[]', -- JSON string
      favorite_genres TEXT DEFAULT '[]',   -- JSON string
      favorite_books TEXT DEFAULT '[]',    -- JSON string
      favorite_authors TEXT DEFAULT '[]',  -- JSON string
      currently_reading_status TEXT,
      reading_streak_days INTEGER DEFAULT 0 CHECK (reading_streak_days >= 0),
      is_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. BOOKS
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      isbn TEXT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      publisher TEXT,
      published_date TEXT,
      genre TEXT,
      categories TEXT DEFAULT '[]', -- JSON string
      page_count INTEGER DEFAULT 0 CHECK (page_count >= 0),
      average_rating REAL DEFAULT 0.0 CHECK (average_rating >= 0 AND average_rating <= 5.0),
      ratings_count INTEGER DEFAULT 0 CHECK (ratings_count >= 0),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. SHELVES
  db.exec(`
    CREATE TABLE IF NOT EXISTS shelves (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      is_public INTEGER DEFAULT 1,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, name)
    );
  `);

  // 4. USER_BOOKS (Junction table)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_books (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      shelf_type TEXT NOT NULL CHECK (shelf_type IN ('want_to_read', 'currently_reading', 'read', 'custom')),
      custom_shelf_id TEXT REFERENCES shelves(id) ON DELETE SET NULL,
      current_page INTEGER DEFAULT 0 CHECK (current_page >= 0),
      total_pages INTEGER DEFAULT 0 CHECK (total_pages >= 0),
      user_rating INTEGER CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5)),
      start_date TEXT,
      finish_date TEXT,
      personal_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_book UNIQUE(user_id, book_id),
      CONSTRAINT check_pages CHECK (total_pages = 0 OR current_page <= total_pages)
    );
  `);

  // 5. REVIEWS
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title TEXT,
      content TEXT NOT NULL,
      has_spoilers INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, book_id)
    );
  `);

  // 6. REVIEW_LIKES
  db.exec(`
    CREATE TABLE IF NOT EXISTS review_likes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, review_id)
    );
  `);

  // 7. COMMENTS
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      review_id TEXT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. FOLLOWS
  db.exec(`
    CREATE TABLE IF NOT EXISTS follows (
      id TEXT PRIMARY KEY,
      follower_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      following_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT follows_no_self CHECK (follower_id <> following_id),
      UNIQUE(follower_id, following_id)
    );
  `);

  // 9. ACTIVITY_FEED
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_feed (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      action_type TEXT NOT NULL CHECK (action_type IN ('started_reading', 'finished_reading', 'added_to_shelf', 'rated_book', 'reviewed_book', 'goal_reached', 'custom_update')),
      book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
      review_id TEXT REFERENCES reviews(id) ON DELETE CASCADE,
      details TEXT DEFAULT '{}', -- JSON string
      likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. READING_GOALS
  db.exec(`
    CREATE TABLE IF NOT EXISTS reading_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      target_books INTEGER NOT NULL CHECK (target_books > 0),
      completed_books INTEGER DEFAULT 0 CHECK (completed_books >= 0),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, year)
    );
  `);

  // 11. READING_SESSIONS
  db.exec(`
    CREATE TABLE IF NOT EXISTS reading_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 0 CHECK (duration_minutes >= 0),
      pages_read INTEGER DEFAULT 0 CHECK (pages_read >= 0),
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. JOURNAL_ENTRIES
  db.exec(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      favorite_quotes TEXT DEFAULT '[]', -- JSON string
      tags TEXT DEFAULT '[]',            -- JSON string
      is_private INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 13. NOTIFICATIONS
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      actor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK (type IN ('follow', 'review_like', 'review_comment', 'comment_reply', 'friend_activity', 'reading_goal_milestone')),
      entity_id TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Indexes for query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_books_user_shelf ON user_books(user_id, shelf_type);
    CREATE INDEX IF NOT EXISTS idx_user_books_book ON user_books(book_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_book_rating ON reviews(book_id, rating);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
    CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
  `);

  return db;
}
