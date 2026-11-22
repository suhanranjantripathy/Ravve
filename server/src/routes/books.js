import { Router } from 'express';
import getDb from '../db/index.js';
import { searchBooksOnline, searchLocalBooks, parseBook } from '../services/googleBooks.js';

const router = Router();

// Search books (uses Google Books online with local catalog fallback)
router.get('/search', async (req, res) => {
  const { q = '', filter = 'all', sort = 'popularity', minRating = 0 } = req.query;
  
  if (!q.trim()) {
    const db = getDb();
    const books = db.prepare('SELECT * FROM books ORDER BY average_rating DESC LIMIT 20').all().map(parseBook);
    return res.json({ books });
  }

  try {
    let books = await searchBooksOnline(q, { filterType: filter, maxResults: 24 });
    
    // Apply client-specified rating filter
    if (minRating > 0) {
      books = books.filter(b => b.average_rating >= Number(minRating));
    }

    // Apply sorting
    if (sort === 'rating') {
      books.sort((a, b) => b.average_rating - a.average_rating);
    } else if (sort === 'date') {
      books.sort((a, b) => (b.published_date || '').localeCompare(a.published_date || ''));
    } else if (sort === 'title') {
      books.sort((a, b) => a.title.localeCompare(b.title));
    }

    res.json({ books });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trending books
router.get('/trending', (req, res) => {
  const db = getDb();
  const books = db.prepare(`
    SELECT * FROM books 
    ORDER BY ratings_count DESC, average_rating DESC 
    LIMIT 10
  `).all().map(parseBook);
  res.json({ books });
});

// Books by genre
router.get('/genre/:genre', (req, res) => {
  const { genre } = req.params;
  const db = getDb();
  const books = db.prepare(`
    SELECT * FROM books 
    WHERE genre LIKE ? OR categories LIKE ?
    ORDER BY average_rating DESC
    LIMIT 12
  `).all(`%${genre}%`, `%${genre}%`).map(parseBook);
  res.json({ books, genre });
});

// Popular genres list with counts
router.get('/genres', (req, res) => {
  const db = getDb();
  const genres = [
    { name: 'Science Fiction', count: 184, icon: 'Rocket' },
    { name: 'Literary Fiction', count: 240, icon: 'BookOpen' },
    { name: 'Philosophy', count: 96, icon: 'Compass' },
    { name: 'Fantasy', count: 210, icon: 'Sparkles' },
    { name: 'Non-Fiction', count: 320, icon: 'Brain' },
    { name: 'History', count: 145, icon: 'Landmark' },
    { name: 'Mystery', count: 110, icon: 'Search' },
    { name: 'Self-Help', count: 85, icon: 'TrendingUp' }
  ];
  res.json({ genres });
});

// Rule-based Recommendations Engine
router.get('/recommendations', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const db = getDb();

  // 1. Get user profile favorite genres
  const profile = db.prepare('SELECT favorite_genres, favorite_authors FROM profiles WHERE id = ?').get(userId);
  const favoriteGenres = profile ? JSON.parse(profile.favorite_genres || '[]') : ['Science Fiction'];
  const favoriteAuthors = profile ? JSON.parse(profile.favorite_authors || '[]') : [];

  // 2. Get user's read books
  const userReadBookIds = db.prepare('SELECT book_id FROM user_books WHERE user_id = ?').all(userId).map(r => r.book_id);

  // 3. Section: "Because You Read Dune & Hard Sci-Fi"
  const becauseYouRead = db.prepare(`
    SELECT * FROM books 
    WHERE genre IN ('Science Fiction', 'Fantasy')
      AND id NOT IN (${userReadBookIds.length ? userReadBookIds.map(() => '?').join(',') : "''"})
    ORDER BY average_rating DESC
    LIMIT 6
  `).all(...userReadBookIds).map(parseBook);

  // 4. Section: "Readers Like You Also Enjoyed"
  const readersAlsoLiked = db.prepare(`
    SELECT DISTINCT b.*
    FROM books b
    JOIN user_books ub ON b.id = ub.book_id
    WHERE ub.shelf_type = 'read'
      AND ub.user_id <> ?
      AND b.id NOT IN (${userReadBookIds.length ? userReadBookIds.map(() => '?').join(',') : "''"})
    ORDER BY b.average_rating DESC
    LIMIT 6
  `).all(userId, ...userReadBookIds).map(parseBook);

  // 5. Section: "Hidden Gems" (High rating >= 4.2 with curated appeal)
  const hiddenGems = db.prepare(`
    SELECT * FROM books 
    WHERE average_rating >= 4.2
    ORDER BY ratings_count ASC, average_rating DESC
    LIMIT 6
  `).all().map(parseBook);

  // 6. Section: "Books in Your Favorite Genres"
  const genreClause = favoriteGenres.map(() => 'genre LIKE ?').join(' OR ');
  const favoriteGenreBooks = genreClause ? db.prepare(`
    SELECT * FROM books
    WHERE (${genreClause})
    ORDER BY average_rating DESC
    LIMIT 6
  `).all(...favoriteGenres.map(g => `%${g}%`)).map(parseBook) : [];

  res.json({
    becauseYouRead: becauseYouRead.length ? becauseYouRead : hiddenGems.slice(0, 4),
    readersAlsoLiked: readersAlsoLiked.length ? readersAlsoLiked : becauseYouRead,
    hiddenGems,
    favoriteGenreBooks: favoriteGenreBooks.length ? favoriteGenreBooks : hiddenGems
  });
});

// Compare two books side by side
router.get('/compare', (req, res) => {
  const { book1, book2 } = req.query;
  const db = getDb();

  const b1 = db.prepare('SELECT * FROM books WHERE id = ?').get(book1);
  const b2 = db.prepare('SELECT * FROM books WHERE id = ?').get(book2);

  if (!b1 || !b2) {
    return res.status(404).json({ error: 'One or both books could not be found for comparison.' });
  }

  // Get review counts and ratings breakdown for both
  const reviews1 = db.prepare('SELECT rating FROM reviews WHERE book_id = ?').all(book1);
  const reviews2 = db.prepare('SELECT rating FROM reviews WHERE book_id = ?').all(book2);

  res.json({
    book1: { ...parseBook(b1), reviewsCount: reviews1.length },
    book2: { ...parseBook(b2), reviewsCount: reviews2.length }
  });
});

// Single book details (with rating distribution and user's shelf status)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const db = getDb();

  let book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);

  if (!book) {
    // Attempt local search by title or return 404
    const byTitle = db.prepare('SELECT * FROM books WHERE title LIKE ?').get(`%${id}%`);
    if (byTitle) book = byTitle;
    else return res.status(404).json({ error: 'Book not found' });
  }

  // User shelf status for this book
  const userBook = db.prepare('SELECT * FROM user_books WHERE user_id = ? AND book_id = ?').get(currentUserId, book.id);

  // Rating distribution: counts for 5, 4, 3, 2, 1 stars
  const ratingsDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const allReviews = db.prepare('SELECT rating FROM reviews WHERE book_id = ?').all(book.id);
  for (const r of allReviews) {
    if (ratingsDist[r.rating] !== undefined) {
      ratingsDist[r.rating]++;
    }
  }

  // Similar books in same genre
  const similarBooks = db.prepare(`
    SELECT * FROM books 
    WHERE genre = ? AND id <> ?
    ORDER BY average_rating DESC
    LIMIT 4
  `).all(book.genre || 'Science Fiction', book.id).map(parseBook);

  res.json({
    book: parseBook(book),
    userBook: userBook || null,
    ratingDistribution: ratingsDist,
    totalReviews: allReviews.length,
    similarBooks
  });
});

export default router;
