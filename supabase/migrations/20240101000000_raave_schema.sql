-- ====================================================================
-- RAAVE Database Schema (Supabase / PostgreSQL)
-- Complete Production Schema with RLS, Constraints, Triggers, & Indexes
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES Table (Public user profiles linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    reading_interests JSONB DEFAULT '[]'::jsonb,
    favorite_genres JSONB DEFAULT '[]'::jsonb,
    favorite_books JSONB DEFAULT '[]'::jsonb,
    favorite_authors JSONB DEFAULT '[]'::jsonb,
    currently_reading_status TEXT,
    reading_streak_days INTEGER DEFAULT 0 CHECK (reading_streak_days >= 0),
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BOOKS Table (Master catalogue of books, enriched via Google Books/Open Library)
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY, -- Google Books ID or Open Library key or custom UUID
    isbn TEXT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    publisher TEXT,
    published_date TEXT,
    genre TEXT,
    categories JSONB DEFAULT '[]'::jsonb,
    page_count INTEGER DEFAULT 0 CHECK (page_count >= 0),
    average_rating NUMERIC(3, 2) DEFAULT 0.00 CHECK (average_rating >= 0 AND average_rating <= 5.00),
    ratings_count INTEGER DEFAULT 0 CHECK (ratings_count >= 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SHELVES Table (Custom bookshelves created by users)
CREATE TABLE IF NOT EXISTS shelves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, name)
);

-- 5. USER_BOOKS Table (Junction table: Tracks user's reading status, progress, shelves)
CREATE TABLE IF NOT EXISTS user_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    shelf_type TEXT NOT NULL CHECK (shelf_type IN ('want_to_read', 'currently_reading', 'read', 'custom')),
    custom_shelf_id UUID REFERENCES shelves(id) ON DELETE SET NULL,
    current_page INTEGER DEFAULT 0 CHECK (current_page >= 0),
    total_pages INTEGER DEFAULT 0 CHECK (total_pages >= 0),
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    start_date DATE,
    finish_date DATE,
    personal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT user_books_unique_book_per_user UNIQUE(user_id, book_id),
    CONSTRAINT user_books_page_logic CHECK (total_pages = 0 OR current_page <= total_pages)
);

-- 6. REVIEWS Table (User reviews and 1-5 star ratings for books)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    content TEXT NOT NULL,
    has_spoilers BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, book_id)
);

-- 7. REVIEW_LIKES Table (Likes on reviews)
CREATE TABLE IF NOT EXISTS review_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, review_id)
);

-- 8. COMMENTS Table (Discussions/comments on reviews)
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. FOLLOWS Table (Social graph: Reader follows reader)
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT follows_cannot_follow_self CHECK (follower_id <> following_id),
    UNIQUE(follower_id, following_id)
);

-- 10. ACTIVITY_FEED Table (Social events for the community feed)
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('started_reading', 'finished_reading', 'added_to_shelf', 'rated_book', 'reviewed_book', 'goal_reached', 'custom_update')),
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    details JSONB DEFAULT '{}'::jsonb,
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. READING_GOALS Table (Annual reading challenges)
CREATE TABLE IF NOT EXISTS reading_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    target_books INTEGER NOT NULL CHECK (target_books > 0),
    completed_books INTEGER DEFAULT 0 CHECK (completed_books >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, year)
);

-- 12. READING_SESSIONS Table (Detailed reading logs with duration and pages)
CREATE TABLE IF NOT EXISTS reading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    duration_minutes INTEGER DEFAULT 0 CHECK (duration_minutes >= 0),
    pages_read INTEGER DEFAULT 0 CHECK (pages_read >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. JOURNAL_ENTRIES Table (Notion-style reading journal & quotes)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    favorite_quotes JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 14. NOTIFICATIONS Table (User alerts for follows, likes, comments, milestones)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('follow', 'review_like', 'review_comment', 'comment_reply', 'friend_activity', 'reading_goal_milestone')),
    entity_id TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- PERFORMANCE INDEXES (Optimized for frequent query patterns)
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_user_books_user_shelf ON user_books(user_id, shelf_type);
CREATE INDEX IF NOT EXISTS idx_user_books_book ON user_books(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_book_rating ON reviews(book_id, rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_book ON reading_sessions(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);

-- Full-text search index for book discovery
CREATE INDEX IF NOT EXISTS idx_books_fts ON books USING gin(to_tsvector('english', title || ' ' || author));

-- ====================================================================
-- TRIGGERS & STORED PROCEDURES (Denormalization maintenance & consistency)
-- ====================================================================

-- Trigger: Automatically update average_rating and ratings_count in books table
CREATE OR REPLACE FUNCTION update_book_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE books
        SET 
            ratings_count = (SELECT COUNT(*) FROM reviews WHERE book_id = OLD.book_id),
            average_rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE book_id = OLD.book_id), 0.00)
        WHERE id = OLD.book_id;
        RETURN OLD;
    ELSE
        UPDATE books
        SET 
            ratings_count = (SELECT COUNT(*) FROM reviews WHERE book_id = NEW.book_id),
            average_rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE book_id = NEW.book_id), 0.00)
        WHERE id = NEW.book_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_book_rating_stats ON reviews;
CREATE TRIGGER trg_update_book_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_book_rating_stats();

-- Trigger: Maintain review likes_count
CREATE OR REPLACE FUNCTION update_review_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE reviews SET likes_count = likes_count + 1 WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE reviews SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_review_likes_count ON review_likes;
CREATE TRIGGER trg_update_review_likes_count
AFTER INSERT OR DELETE ON review_likes
FOR EACH ROW
EXECUTE FUNCTION update_review_likes_count();

-- Trigger: Automatically update annual reading goal when a book is moved to 'read'
CREATE OR REPLACE FUNCTION sync_reading_goal_on_book_finished()
RETURNS TRIGGER AS $$
DECLARE
    finish_year INTEGER;
BEGIN
    IF (NEW.shelf_type = 'read' AND (OLD IS NULL OR OLD.shelf_type <> 'read')) THEN
        finish_year := COALESCE(EXTRACT(YEAR FROM NEW.finish_date)::INTEGER, EXTRACT(YEAR FROM now())::INTEGER);
        
        -- Increment completed_books in reading_goals if an entry exists for that year
        UPDATE reading_goals
        SET completed_books = completed_books + 1, updated_at = now()
        WHERE user_id = NEW.user_id AND year = finish_year;
        
        -- Also insert activity feed record
        INSERT INTO activity_feed (user_id, action_type, book_id, details)
        VALUES (NEW.user_id, 'finished_reading', NEW.book_id, json_build_object('finish_date', NEW.finish_date));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_reading_goal_on_book_finished ON user_books;
CREATE TRIGGER trg_sync_reading_goal_on_book_finished
AFTER INSERT OR UPDATE ON user_books
FOR EACH ROW
EXECUTE FUNCTION sync_reading_goal_on_book_finished();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view public profiles; only owner can update or insert
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (is_public = true OR auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- User Books: Public if user profile is public; private shelves only owner
CREATE POLICY "Users can view public reading activity" ON user_books FOR SELECT USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = user_books.user_id AND profiles.is_public = true)
);
CREATE POLICY "Users can manage own user_books" ON user_books FOR ALL USING (auth.uid() = user_id);

-- Shelves: View public shelves, owner can manage
CREATE POLICY "Public shelves are viewable by everyone" ON shelves FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own shelves" ON shelves FOR ALL USING (auth.uid() = user_id);

-- Reviews: Viewable by all; owner can create/edit/delete
CREATE POLICY "Reviews viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Journal Entries: Only owner can view and manage private entries
CREATE POLICY "Users can view own or non-private journal entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id OR is_private = false);
CREATE POLICY "Users can manage own journal entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);

-- Notifications: Only recipient can see and update their notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ====================================================================
-- SUPABASE AUTH INTEGRATION TRIGGER
-- ====================================================================
-- Auto-create profile and initial reading goal when user registers in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    gen_username TEXT;
    gen_fullname TEXT;
BEGIN
    gen_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(COALESCE(NEW.email, 'reader'), '@', 1));
    gen_fullname := COALESCE(NEW.raw_user_meta_data->>'full_name', gen_username);

    INSERT INTO public.profiles (id, username, full_name, avatar_url, bio, favorite_genres)
    VALUES (
        NEW.id,
        gen_username,
        gen_fullname,
        'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id,
        'Avid reader on RAAVE',
        '["Fiction", "Non-Fiction"]'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.reading_goals (id, user_id, year, target_books, completed_books)
    VALUES (
        uuid_generate_v4(),
        NEW.id,
        EXTRACT(YEAR FROM now())::INTEGER,
        25,
        0
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
