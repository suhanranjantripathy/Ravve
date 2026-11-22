import { Router } from 'express';
import getDb from '../db/index.js';

const router = Router();

// Get custom shelves for user
router.get('/', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const targetUserId = req.query.userId || currentUserId;
  const db = getDb();

  const shelves = db.prepare(`
    SELECT s.*, COUNT(ub.id) as book_count
    FROM shelves s
    LEFT JOIN user_books ub ON s.id = ub.custom_shelf_id
    WHERE s.user_id = ?
    GROUP BY s.id
    ORDER BY s.created_at ASC
  `).all(targetUserId);

  res.json({ shelves });
});

// Create custom shelf
router.post('/', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { name, description = '', is_public = true } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Shelf name is required' });
  }

  const db = getDb();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const id = `shf_${Date.now()}`;

  try {
    db.prepare(`
      INSERT INTO shelves (id, user_id, name, slug, description, is_public)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, name.trim(), slug, description, is_public ? 1 : 0);

    const newShelf = db.prepare('SELECT *, 0 as book_count FROM shelves WHERE id = ?').get(id);
    res.status(201).json({ shelf: newShelf });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'A shelf with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete shelf
router.delete('/:id', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { id } = req.params;
  const db = getDb();

  db.prepare('DELETE FROM shelves WHERE id = ? AND user_id = ?').run(id, userId);
  res.json({ message: 'Shelf deleted successfully' });
});

export default router;
