import { Router } from 'express';
import getDb from '../db/index.js';

const router = Router();

// Get journal entries
router.get('/', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const { bookId } = req.query;
  const db = getDb();

  let sql = `
    SELECT j.*, b.title as book_title, b.author as book_author, b.cover_url as book_cover
    FROM journal_entries j
    LEFT JOIN books b ON j.book_id = b.id
    WHERE j.user_id = ?
  `;
  const params = [currentUserId];

  if (bookId) {
    sql += ` AND j.book_id = ?`;
    params.push(bookId);
  }

  sql += ` ORDER BY j.created_at DESC`;

  const entries = db.prepare(sql).all(...params).map(e => ({
    ...e,
    favorite_quotes: typeof e.favorite_quotes === 'string' ? JSON.parse(e.favorite_quotes || '[]') : e.favorite_quotes,
    tags: typeof e.tags === 'string' ? JSON.parse(e.tags || '[]') : e.tags,
    is_private: Boolean(e.is_private)
  }));

  res.json({ entries });
});

// Dedicated favorite quotes collection extracted across all journal entries
router.get('/quotes', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const db = getDb();

  const entries = db.prepare(`
    SELECT j.id as entry_id, j.favorite_quotes, b.title as book_title, b.author as book_author, b.cover_url as book_cover
    FROM journal_entries j
    LEFT JOIN books b ON j.book_id = b.id
    WHERE j.user_id = ? AND j.favorite_quotes IS NOT NULL AND j.favorite_quotes <> '[]'
  `).all(currentUserId);

  const allQuotes = [];
  for (const e of entries) {
    const quotes = typeof e.favorite_quotes === 'string' ? JSON.parse(e.favorite_quotes) : e.favorite_quotes;
    if (Array.isArray(quotes)) {
      quotes.forEach(q => {
        allQuotes.push({
          ...q,
          entryId: e.entry_id,
          bookTitle: e.book_title || 'General Thought',
          bookAuthor: e.book_author || 'Unknown',
          bookCover: e.book_cover
        });
      });
    }
  }

  res.json({ quotes: allQuotes });
});

// Create journal entry
router.post('/', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { title, content, book_id = null, favorite_quotes = [], tags = [], is_private = true } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const db = getDb();
  const id = `jrn_${Date.now()}`;

  db.prepare(`
    INSERT INTO journal_entries (id, user_id, book_id, title, content, favorite_quotes, tags, is_private)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    userId,
    book_id,
    title.trim(),
    content.trim(),
    JSON.stringify(favorite_quotes),
    JSON.stringify(tags),
    is_private ? 1 : 0
  );

  const created = db.prepare(`
    SELECT j.*, b.title as book_title, b.author as book_author, b.cover_url as book_cover
    FROM journal_entries j
    LEFT JOIN books b ON j.book_id = b.id
    WHERE j.id = ?
  `).get(id);

  res.status(201).json({
    message: 'Journal entry created',
    entry: {
      ...created,
      favorite_quotes,
      tags,
      is_private: Boolean(created.is_private)
    }
  });
});

// Delete journal entry
router.delete('/:id', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { id } = req.params;
  const db = getDb();

  db.prepare('DELETE FROM journal_entries WHERE id = ? AND user_id = ?').run(id, userId);
  res.json({ message: 'Journal entry deleted' });
});

export default router;
