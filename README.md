# RAAVE — Modern Reading Community & Book Discovery Platform

> An editorial, high-performance book discovery and reading community platform inspired by Goodreads, Letterboxd, Pinterest, and Notion.

---

## 🌟 Overview

**RAAVE** is a full-stack reading community platform designed to replace legacy book cataloguing software with an elegant, responsive, and distraction-free experience. Built with **React 18 + Vite + Tailwind CSS** on the frontend, **Node.js + Express** on the backend, and **Supabase (PostgreSQL)** for robust relational data persistence and authentication.

### Key Highlights
- **Goodreads-grade Functionality**: 3 default shelves (*Want to Read*, *Currently Reading*, *Read*), custom shelves, reading challenge tracker, and CSV import/export.
- **Letterboxd-style Social Dynamics**: Follow readers, activity feeds, spoiler-flagged reviews, like/comment threads, and top-4 all-time favorites showcase.
- **Pinterest-grade Visual Discovery**: Real-time integration with **Google Books API** and **Open Library API** with rich book spine depth, rating filters, and genre carousels.
- **Notion-inspired Reading Journal**: Private chapter logs, thought annotations, and a dedicated **Favorite Quotes Collection** across all shelved books.
- **Side-by-Side Book Comparison**: Compare page counts, publication dates, publishers, average ratings, and community reviews.
- **Dark Mode Support**: Seamless toggle between warm off-white parchment and obsidian night themes.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Framer Motion, Zustand, Canvas Confetti |
| **Backend** | Node.js, Express, Better-SQLite3 / Supabase JS Client, REST API |
| **Database** | Supabase (PostgreSQL 15+) with full SQLite parity engine for zero-config offline execution |
| **APIs** | Google Books API & Open Library Search API with automatic caching and cover resolution |
| **State Management** | Zustand (`useAuthStore`, `useThemeStore`) |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js `v18+` or `v20+` (Tested on `v24.19.0`)
- npm `v9+` or `v11+`

### 1. Clone & Install Dependencies
```bash
# Install root, server, and client packages
npm run install:all
```

### 2. Run the Full-Stack Application
```bash
# Starts both Express backend (port 5001) and Vite client (port 5173)
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.
*(Alternatively, [http://localhost:5001](http://localhost:5001) serves the built production bundle directly!)*

### 3. Demo Reader Personas (One-Click Testing)
The application includes pre-seeded profiles to test multi-user interactions:
- **Elena Rostova** (`elena_reads`): Speculative fiction & philosophy enthusiast (Active reading challenge: 24/36).
- **Marcus Vance** (`marcus_aurelius_club`): Stoicism, ancient history, and non-fiction.
- **Sophia Chen** (`sophia_reads`): High fantasy, cyberpunk, and mystery.
- **Alex Wright** (`alex_wright`): Behavioral economics and productivity.

*Use the active persona dropdown in the top navbar to switch between users in 1 click!*

---

## 🗄️ Database Architecture & Setup

### Supabase / PostgreSQL Setup
1. Create a project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Run the complete migration script located at:
   ```
   supabase/migrations/20240101000000_raave_schema.sql
   ```
4. Copy your project URL and `anon` / `service_role` key into `.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-or-service-key
   PORT=5001
   ```

---

# 📚 Comprehensive Technical Interview Answers (Q1 – Q5)

---

### Q1. Why did you choose this database?
**Database Chosen:** **PostgreSQL (via Supabase)** [with local SQLite parity via `better-sqlite3`].  
**Database Type:** **Relational Database Management System (RDBMS)** with native JSONB support.

#### 1. What our data looks like
Our data is **structured and highly connected**:
- A single user relates to bookshelves, reading progress, journal entries, review likes, social follows, and annual reading goals.
- The social graph requires relational integrity (`follows` table mapping `follower_id` $\leftrightarrow$ `following_id`).
- Books connect to many reviews, reading sessions, and user shelves through classic $M:N$ junction tables.
- Semi-structured data (like category tags, reading interests, and highlight quotes `{ quote, page, note }`) is cleanly stored using PostgreSQL's native `JSONB` data type, providing both relational rigor and document flexibility.

#### 2. Read and Write Patterns & Data Volume Expectations
- **Read/Write Ratio:** Heavily read-intensive ($\approx 85\%$ reads, $15\%$ writes).
- **Read Patterns:** Rapid dashboard queries joining user reading progress with book covers, paginated community feeds, and book detail aggregations (average ratings and rating distribution).
- **Write Patterns:** Page progress updates (`user_books`), review submissions, review likes, follow toggles, and reading session logs.
- **Volume Expectations:** $\sim 500,000$ active readers, each having $100$ to $500$ shelved books and tens of thousands of community reviews.

#### 3. Strong Consistency & Transactions
Strong consistency (**ACID**) is non-negotiable for RAAVE:
- When a user finishes the last page of a book, several operations must occur **atomically**:
  1. The shelf status updates from `currently_reading` to `read`.
  2. The finish date is recorded.
  3. The reading challenge's `completed_books` counter increments.
  4. An activity feed event (`finished_reading`) is inserted.
  If any step fails, the entire transaction rolls back. Eventual consistency in a document store would allow desynchronization where a user completed 20 books on their shelf but their challenge progress displays 19.

#### 4. Alternatives Considered & Rejected
- **MongoDB (Document Store):** Rejected because reading social platforms are inherently graph-relational. Embedding reviews or user progress inside a single book document creates unbounded arrays (thousands of reviews per book exceeding the 16MB document limit). Referencing documents across collections in MongoDB requires multi-document `$lookup` aggregations that degrade performance and lack native relational constraints.
- **DynamoDB (Key-Value):** Rejected due to complex query access patterns (filtering by shelf, sorting by author/date/rating, calculating rating histograms, and social follower timelines) which would require excessive Global Secondary Indexes (GSIs) and high operational overhead.

#### 5. Sample Project Data & Most Frequent Queries
```json
// Sample user_books record
{
  "id": "ub_1",
  "user_id": "usr_elena",
  "book_id": "book_children_of_time",
  "shelf_type": "currently_reading",
  "current_page": 384,
  "total_pages": 600,
  "start_date": "2026-11-02",
  "finish_date": null,
  "personal_notes": "The Portia web architecture is mind-bending."
}
```

**Top Frequent Queries:**
1. *Fetch User's Active Dashboard Bookshelves:*
   ```sql
   SELECT ub.*, b.title, b.author, b.cover_url, b.page_count
   FROM user_books ub
   JOIN books b ON ub.book_id = b.id
   WHERE ub.user_id = $1 AND ub.shelf_type = 'currently_reading'
   ORDER BY ub.updated_at DESC;
   ```
2. *Community Activity Stream for Followed Readers:*
   ```sql
   SELECT a.*, p.username, p.full_name, p.avatar_url, b.title, b.cover_url
   FROM activity_feed a
   JOIN profiles p ON a.user_id = p.id
   LEFT JOIN books b ON a.book_id = b.id
   WHERE a.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
   ORDER BY a.created_at DESC LIMIT 25;
   ```

---

### Q2. Walk us through your schema or data model.

#### 1. Entity-Relationship (ER) Diagram
```
  +--------------+          +-------------------+          +---------------+
  |   PROFILES   | 1 ---- M |    USER_BOOKS     | M ---- 1 |     BOOKS     |
  +--------------+          +-------------------+          +---------------+
  | id (PK)      |          | id (PK)           |          | id (PK)       |
  | username(UQ) |          | user_id (FK)      |          | title         |
  | full_name    |          | book_id (FK)      |          | author        |
  | avatar_url   |          | shelf_type        |          | page_count    |
  | streak_days  |          | current_page      |          | avg_rating    |
  +-------+------+          | total_pages       |          +-------+-------+
          |                 | user_rating       |                  |
          | 1               +-------------------+                  | 1
          |                                                        |
          | M                                                      | M
  +-------+------+          +-------------------+          +-------+-------+
  |    FOLLOWS   |          |      REVIEWS      | 1 ---- M |    COMMENTS   |
  +--------------+          +-------------------+          +---------------+
  | id (PK)      |          | id (PK)           |          | id (PK)       |
  | follower(FK) |          | user_id (FK)      |          | review_id(FK) |
  | following(FK)|          | book_id (FK)      |          | user_id (FK)  |
  +--------------+          | rating (1..5)     |          | content       |
                            | likes_count       |          +---------------+
                            +-------------------+
```

#### 2. Key Entities & Cardinalities
- **`profiles` $\leftrightarrow$ `user_books` ($1:N$):** A reader owns many shelved books.
- **`books` $\leftrightarrow$ `user_books` ($1:N$):** A book appears on many users' shelves.
- **$M:N$ Resolution:** The `user_books` table resolves the Many-to-Many relationship between `profiles` and `books`, storing contextual reading progress (`current_page`, `shelf_type`, `user_rating`, `start_date`, `finish_date`).
- **`profiles` $\leftrightarrow$ `follows` ($M:N$ Self-Referential):** Resolved via the `follows` junction table (`follower_id`, `following_id`) with a `CHECK (follower_id <> following_id)` constraint.
- **`reviews` $\leftrightarrow$ `review_likes` ($1:N$):** Ensures a user can only like a review once via `UNIQUE(user_id, review_id)`.

#### 3. Cross-Relationship Join Query Example
```sql
SELECT 
    r.id AS review_id,
    r.rating,
    r.title AS review_title,
    r.content,
    p.username,
    p.full_name,
    p.avatar_url,
    b.title AS book_title,
    b.author AS book_author,
    COUNT(c.id) AS comments_count,
    EXISTS(SELECT 1 FROM review_likes rl WHERE rl.review_id = r.id AND rl.user_id = $1) AS user_has_liked
FROM reviews r
JOIN profiles p ON r.user_id = p.id
JOIN books b ON r.book_id = b.id
LEFT JOIN comments c ON r.id = c.review_id
WHERE r.book_id = $2
GROUP BY r.id, p.id, b.id
ORDER BY r.likes_count DESC;
```

---

### Q3. What normal form is your design in, and where did you deliberately break it?

#### 1. Normal Form State: **3NF (Third Normal Form) & BCNF**
All primary entities (`profiles`, `shelves`, `user_books`, `comments`, `follows`, `reading_goals`) strictly satisfy **Third Normal Form**:
- **1NF:** All attributes are atomic; no repeating groups.
- **2NF:** Every non-key attribute is fully functionally dependent on the entire primary key. In `user_books(user_id, book_id)`, progress attributes (`current_page`, `shelf_type`) depend on both the user and the book, not a subset.
- **3NF:** No non-key attribute is transitively dependent on another non-key attribute (e.g., book author or publisher details are **not** stored in `user_books`; they reference `books(id)`).

#### 2. Functional Dependencies Analysis (`reviews` table)
- `id` $\rightarrow$ `{ user_id, book_id, rating, title, content, has_spoilers, likes_count, created_at, updated_at }`
- `{ user_id, book_id }` $\rightarrow$ `{ id, rating, title, content, has_spoilers }` (since a user can only write one review per book).
Every determinant is a candidate key $\Rightarrow$ Satisfies **Boyce-Codd Normal Form (BCNF)**.

#### 3. Deliberate Denormalization
To guarantee sub-millisecond response times across book lists and discovery feeds, we selectively denormalized two fields:
1. **`books.average_rating` & `books.ratings_count`**:
   - *Why:* Computing `AVG(rating)` and `COUNT(*)` across millions of rows on every search result query would cripple database I/O.
   - *How correctness is maintained:* A PostgreSQL database trigger `trg_update_book_rating_stats` executes automatically after any `INSERT`, `UPDATE`, or `DELETE` on the `reviews` table:
   ```sql
   CREATE OR REPLACE FUNCTION update_book_rating_stats()
   RETURNS TRIGGER AS $$
   BEGIN
       UPDATE books
       SET 
           ratings_count = (SELECT COUNT(*) FROM reviews WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)),
           average_rating = COALESCE((SELECT ROUND(AVG(rating), 2) FROM reviews WHERE book_id = COALESCE(NEW.book_id, OLD.book_id)), 0.00)
       WHERE id = COALESCE(NEW.book_id, OLD.book_id);
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```
2. **`reviews.likes_count`**:
   - Maintained via `trg_update_review_likes_count` after insert/delete on `review_likes`.

---

### Q4. How does your database protect data correctness?

#### 1. Declarative Constraints
- **NOT NULL:** Enforced on essential keys and contents (`profiles.username`, `books.title`, `reviews.content`, `user_books.shelf_type`).
- **UNIQUE Constraints:**
  - `user_books(user_id, book_id)`: Guarantees a book cannot be duplicated on a user's shelves.
  - `reviews(user_id, book_id)`: Restricts each user to one review per book.
  - `follows(follower_id, following_id)`: Prevents duplicate follow links.
  - `review_likes(user_id, review_id)`: Prevents multiple likes from the same reader.
- **CHECK Constraints:**
  - `reviews.rating CHECK (rating >= 1 AND rating <= 5)`
  - `user_books CHECK (total_pages = 0 OR current_page <= total_pages)`: Protects against impossible progress states (e.g., page 500 of a 300-page book).
  - `follows CHECK (follower_id <> following_id)`: Prevents self-following.
  - `reading_goals.target_books CHECK (target_books > 0)`

#### 2. Practical Demonstration of Constraint Rejection
Verified programmatically via test runner:
```bash
CHECK constraint failed: rating >= 1 AND rating <= 5 -> REJECTED (Attempted rating: 9)
CHECK constraint failed: check_pages -> REJECTED (Attempted current_page: 999 on 500-page book)
UNIQUE constraint failed: user_books.user_id, user_books.book_id -> REJECTED (Duplicate book on shelf)
```

#### 3. Transactions & Atomicity
When updating reading progress to 100%:
```javascript
const progressTx = db.transaction(() => {
  // 1. Update page progress & move shelf to 'read'
  db.prepare(`UPDATE user_books SET current_page = ?, shelf_type = 'read', finish_date = ? WHERE user_id = ? AND book_id = ?`)
    .run(total, today, userId, bookId);

  // 2. Increment annual challenge completed books
  db.prepare(`UPDATE reading_goals SET completed_books = completed_books + 1 WHERE user_id = ? AND year = ?`)
    .run(userId, currentYear);

  // 3. Insert activity feed record
  db.prepare(`INSERT INTO activity_feed (id, user_id, action_type, book_id, details) VALUES (?, ?, 'finished_reading', ?, ?)`)
    .run(actId, userId, bookId, JSON.stringify({ finish_date: today }));
});
progressTx(); // If step 3 fails, steps 1 and 2 automatically roll back!
```

#### 4. Concurrency & Isolation Levels
- PostgreSQL defaults to **Read Committed** isolation level, which prevents dirty reads.
- For concurrent rating updates or follow actions, PostgreSQL utilizes **row-level locking** (`SELECT ... FOR UPDATE` or atomic `ON CONFLICT DO UPDATE` upserts) preventing race conditions when two likes arrive simultaneously.

---

### Q5. How did you make your database usage efficient?

#### 1. Index Strategy
We designed compound B-Tree indexes matching our exact `WHERE` and `ORDER BY` clauses:
1. `idx_user_books_user_shelf ON user_books(user_id, shelf_type)`: Accelerates dashboard and bookshelf filtering from $O(N)$ table scans down to $O(\log N)$ index range scans.
2. `idx_reviews_book_rating ON reviews(book_id, rating DESC)`: Accelerates book detail review lists and rating filters.
3. `idx_activity_feed_user ON activity_feed(user_id, created_at DESC)`: Optimizes social feed generation.
4. `idx_books_fts ON books USING gin(to_tsvector('english', title || ' ' || author))`: High-speed Full-Text Search (FTS) index for instant book queries.

#### 2. Indexes Considered but Rejected
- An index on `user_books(current_page)` was rejected because users update their reading progress frequently while reading, which would incur high write amplification and write-overhead during rapid page jumps.

#### 3. Performance Techniques Used
- **Prepared Statement Caching:** Every query is pre-compiled into a prepared statement (`db.prepare(...)`), saving query planning time.
- **Composite Foreign Key Indexes:** Indexes on all junction tables (`user_books`, `review_likes`, `follows`) prevent locking cascades during deletions.
- **Client-Side Debouncing & Pagination:** Network calls from search inputs are debounced, and feeds are limited to fixed batches (`LIMIT 25`).

#### 4. What Breaks First at 100x Scale & Future Architectural Roadmap
If our user base grows 100-fold ($\approx 50\text{M}$ users, $5\text{B}$ records):
1. **Activity Feed Fan-Out ($O(F)$ joins):** Querying `activity_feed` across hundreds of followed users will bottleneck database CPU.  
   *Fix:* Implement a Redis-backed Fan-out Cache for social timelines (pushing feed IDs to followed users' Redis lists asynchronously via BullMQ/Kafka).
2. **Connection Starvation:** High concurrent traffic will exhaust PostgreSQL client connections.  
   *Fix:* Introduce **PgBouncer** / **Supavisor** for connection pooling, backed by read-replicas for `GET /books/*` and `GET /search`.
3. **Large Table Growth on `activity_feed` & `reading_sessions`:**  
   *Fix:* Implement **Table Partitioning** by range (`PARTITION BY RANGE (created_at)` per month or year) so older partitions can be archived to cold storage.

---

## 📜 License
MIT License. Crafted with care for the global reading community.
