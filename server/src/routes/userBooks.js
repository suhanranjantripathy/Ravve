import { Router } from 'express';
import getDb from '../db/index.js';
import { parseBook } from '../services/googleBooks.js';

const router = Router();

// Get books for current user (or specified user) filtered by shelf
router.get('/', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const targetUserId = req.query.userId || currentUserId;
  const { shelf, sort = 'updated_at', order = 'DESC' } = req.query;

  const db = getDb();
  let query = `
    SELECT ub.*, b.title, b.author, b.cover_url, b.genre, b.average_rating as book_avg_rating, b.page_count as book_pages, b.isbn, b.published_date, s.name as custom_shelf_name
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    LEFT JOIN shelves s ON ub.custom_shelf_id = s.id
    WHERE ub.user_id = ?
  `;

  const params = [targetUserId];

  if (shelf && shelf !== 'all') {
    if (shelf === 'custom' && req.query.customShelfId) {
      query += ` AND ub.custom_shelf_id = ?`;
      params.push(req.query.customShelfId);
    } else {
      query += ` AND ub.shelf_type = ?`;
      params.push(shelf);
    }
  }

  // Sorting
  let orderColumn = 'ub.updated_at';
  if (sort === 'title') orderColumn = 'b.title';
  else if (sort === 'author') orderColumn = 'b.author';
  else if (sort === 'rating') orderColumn = 'COALESCE(ub.user_rating, b.average_rating)';
  else if (sort === 'date_added') orderColumn = 'ub.created_at';
  else if (sort === 'progress') orderColumn = 'ub.current_page';

  query += ` ORDER BY ${orderColumn} ${order === 'ASC' ? 'ASC' : 'DESC'}`;

  const books = db.prepare(query).all(...params);
  res.json({ books });
});

// Add book to shelf
router.post('/', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { book_id, shelf_type = 'want_to_read', custom_shelf_id = null, total_pages = 0 } = req.body;

  if (!book_id) {
    return res.status(400).json({ error: 'book_id is required' });
  }

  const db = getDb();

  // Check if book exists in books table; if total_pages not given, fetch from book
  const book = db.prepare('SELECT page_count, title FROM books WHERE id = ?').get(book_id);
  const pages = total_pages || (book ? book.page_count : 0);

  const insertOrUpdate = db.prepare(`
    INSERT INTO user_books (id, user_id, book_id, shelf_type, custom_shelf_id, total_pages, current_page, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, book_id) DO UPDATE SET
      shelf_type = excluded.shelf_type,
      custom_shelf_id = excluded.custom_shelf_id,
      total_pages = CASE WHEN excluded.total_pages > 0 THEN excluded.total_pages ELSE user_books.total_pages END,
      updated_at = CURRENT_TIMESTAMP
  `);

  const id = `ub_${Date.now()}`;
  insertOrUpdate.run(id, userId, book_id, shelf_type, custom_shelf_id, pages);

  // Record social activity
  let actionType = 'added_to_shelf';
  if (shelf_type === 'currently_reading') actionType = 'started_reading';
  else if (shelf_type === 'read') actionType = 'finished_reading';

  db.prepare(`
    INSERT INTO activity_feed (id, user_id, action_type, book_id, details)
    VALUES (?, ?, ?, ?, ?)
  `).run(`act_${Date.now()}`, userId, actionType, book_id, JSON.stringify({ shelf: shelf_type, book_title: book?.title }));

  res.json({ message: 'Book added to shelf', shelf_type });
});

// Update reading tracker progress (current page, total pages, dates, notes)
router.put('/:bookId/progress', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { bookId } = req.params;
  const { current_page, total_pages, start_date, finish_date, personal_notes, shelf_type } = req.body;

  const db = getDb();
  const existing = db.prepare('SELECT * FROM user_books WHERE user_id = ? AND book_id = ?').get(userId, bookId);

  if (!existing) {
    return res.status(404).json({ error: 'Book is not on your shelf' });
  }

  const effectiveTotal = total_pages !== undefined ? Number(total_pages) : existing.total_pages;
  let newCurrentPage = current_page !== undefined ? Number(current_page) : existing.current_page;
  let newShelfType = shelf_type || existing.shelf_type;
  let newFinishDate = finish_date || existing.finish_date;

  // Auto-move to 'read' if current_page matches or exceeds total_pages
  if (effectiveTotal > 0 && newCurrentPage >= effectiveTotal && newShelfType !== 'read') {
    newShelfType = 'read';
    newFinishDate = newFinishDate || new Date().toISOString().split('T')[0];

    // Atomically increment reading challenge completed_books for current year
    const currentYear = new Date().getFullYear();
    db.prepare(`
      UPDATE reading_goals 
      SET completed_books = completed_books + 1, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND year = ?
    `).run(userId, currentYear);

    // Add activity feed record
    db.prepare(`
      INSERT INTO activity_feed (id, user_id, action_type, book_id, details)
      VALUES (?, ?, 'finished_reading', ?, ?)
    `).run(`act_${Date.now()}`, userId, bookId, JSON.stringify({ finish_date: newFinishDate }));
  }

  // Update user_books table
  db.prepare(`
    UPDATE user_books SET
      current_page = ?,
      total_pages = ?,
      start_date = COALESCE(?, start_date),
      finish_date = COALESCE(?, finish_date),
      personal_notes = COALESCE(?, personal_notes),
      shelf_type = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND book_id = ?
  `).run(newCurrentPage, effectiveTotal, start_date, newFinishDate, personal_notes, newShelfType, userId, bookId);

  // If pages were logged in this update, record a reading session
  if (current_page !== undefined && current_page > existing.current_page) {
    const pagesGained = current_page - existing.current_page;
    db.prepare(`
      INSERT INTO reading_sessions (id, user_id, book_id, date, duration_minutes, pages_read, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(`sess_${Date.now()}`, userId, bookId, new Date().toISOString().split('T')[0], Math.round(pagesGained * 1.5), pagesGained, personal_notes || 'Quick progress update');
  }

  const updated = db.prepare(`
    SELECT ub.*, b.title, b.author, b.cover_url, b.page_count
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    WHERE ub.user_id = ? AND ub.book_id = ?
  `).get(userId, bookId);

  res.json({ message: 'Progress updated', book: updated });
});

// Remove book from user's shelves
router.delete('/:bookId', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { bookId } = req.params;
  const db = getDb();

  db.prepare('DELETE FROM user_books WHERE user_id = ? AND book_id = ?').run(userId, bookId);
  res.json({ message: 'Book removed from bookshelf' });
});

// CSV Export: Export user's bookshelf to standard CSV format
router.get('/export/csv', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const db = getDb();

  const userBooks = db.prepare(`
    SELECT b.title, b.author, b.isbn, ub.shelf_type, ub.user_rating, ub.current_page, ub.total_pages, ub.start_date, ub.finish_date, ub.personal_notes
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    WHERE ub.user_id = ?
    ORDER BY ub.created_at DESC
  `).all(userId);

  const headers = ['Title', 'Author', 'ISBN', 'Bookshelves', 'My Rating', 'Current Page', 'Total Pages', 'Date Started', 'Date Read', 'My Review/Notes'];
  const rows = userBooks.map(b => [
    `"${(b.title || '').replace(/"/g, '""')}"`,
    `"${(b.author || '').replace(/"/g, '""')}"`,
    `"${b.isbn || ''}"`,
    `"${b.shelf_type}"`,
    b.user_rating || '',
    b.current_page || 0,
    b.total_pages || 0,
    b.start_date || '',
    b.finish_date || '',
    `"${(b.personal_notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="raave_reading_history.csv"');
  res.send(csvContent);
});

// CSV Import: Import books into user's shelf
router.post('/import/csv', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { books = [] } = req.body;
  const db = getDb();

  let importedCount = 0;

  const insertBook = db.prepare(`
    INSERT INTO books (id, title, author, isbn, genre, page_count, average_rating)
    VALUES (?, ?, ?, ?, ?, ?, 4.0)
    ON CONFLICT(id) DO NOTHING
  `);

  const insertUserBook = db.prepare(`
    INSERT INTO user_books (id, user_id, book_id, shelf_type, user_rating, total_pages, current_page, finish_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, book_id) DO UPDATE SET
      shelf_type = excluded.shelf_type,
      user_rating = excluded.user_rating
  `);

  const importTx = db.transaction(() => {
    for (const b of books) {
      if (!b.title || !b.author) continue;
      const bookId = `import_${Math.abs(b.title.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`;
      const pages = Number(b.total_pages || b.page_count || 300);
      const rating = Number(b.rating || b.my_rating) || null;
      let shelf = (b.shelf || b.bookshelves || 'want_to_read').toLowerCase();
      if (shelf.includes('read')) shelf = 'read';
      else if (shelf.includes('current')) shelf = 'currently_reading';
      else shelf = 'want_to_read';

      insertBook.run(bookId, b.title, b.author, b.isbn || null, b.genre || 'General', pages);
      insertUserBook.run(`ub_imp_${Date.now()}_${importedCount}`, userId, bookId, shelf, rating, pages, shelf === 'read' ? pages : 0, b.finish_date || null);
      importedCount++;
    }
  });

  importTx();
  res.json({ message: `Successfully imported ${importedCount} books`, importedCount });
});

export default router;
