import { Router } from 'express';
import getDb from '../db/index.js';

const router = Router();

// Get reading challenge for user (current year & history)
router.get('/', (req, res) => {
  const currentUserId = req.headers['x-user-id'] || 'usr_elena';
  const targetUserId = req.query.userId || currentUserId;
  const currentYear = new Date().getFullYear();
  const db = getDb();

  // Ensure current year record exists
  let currentGoal = db.prepare('SELECT * FROM reading_goals WHERE user_id = ? AND year = ?').get(targetUserId, currentYear);
  
  if (!currentGoal) {
    const goalId = `goal_${targetUserId}_${currentYear}`;
    db.prepare(`
      INSERT INTO reading_goals (id, user_id, year, target_books, completed_books)
      VALUES (?, ?, ?, 25, 0)
    `).run(goalId, targetUserId, currentYear);
    currentGoal = db.prepare('SELECT * FROM reading_goals WHERE id = ?').get(goalId);
  }

  // Recalculate actual completed books from user_books for accuracy
  const actualCompleted = db.prepare(`
    SELECT COUNT(*) as cnt 
    FROM user_books 
    WHERE user_id = ? 
      AND shelf_type = 'read'
      AND (finish_date LIKE ? OR (finish_date IS NULL AND updated_at LIKE ?))
  `).get(targetUserId, `${currentYear}%`, `${currentYear}%`).cnt;

  // Sync if needed
  if (actualCompleted !== currentGoal.completed_books) {
    db.prepare('UPDATE reading_goals SET completed_books = ? WHERE id = ?').run(actualCompleted, currentGoal.id);
    currentGoal.completed_books = actualCompleted;
  }

  // Completed books list for this challenge
  const booksCompletedThisYear = db.prepare(`
    SELECT b.id, b.title, b.author, b.cover_url, b.page_count, ub.user_rating, ub.finish_date
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    WHERE ub.user_id = ? AND ub.shelf_type = 'read'
    ORDER BY ub.finish_date DESC, ub.updated_at DESC
  `).all(targetUserId);

  // Past years challenge history
  const previousGoals = db.prepare(`
    SELECT * FROM reading_goals 
    WHERE user_id = ? AND year < ? 
    ORDER BY year DESC
  `).all(targetUserId, currentYear);

  // Challenge Milestones
  const milestones = [
    { name: 'First 5 Books', target: 5, achieved: currentGoal.completed_books >= 5, icon: 'Flame' },
    { name: 'Halfway There', target: Math.ceil(currentGoal.target_books / 2), achieved: currentGoal.completed_books >= Math.ceil(currentGoal.target_books / 2), icon: 'Compass' },
    { name: 'Double Digits (10 Books)', target: 10, achieved: currentGoal.completed_books >= 10, icon: 'Award' },
    { name: 'Century Mark (25 Books)', target: 25, achieved: currentGoal.completed_books >= 25, icon: 'Trophy' },
    { name: 'Goal Achieved!', target: currentGoal.target_books, achieved: currentGoal.completed_books >= currentGoal.target_books, icon: 'Crown' }
  ];

  res.json({
    currentGoal: {
      ...currentGoal,
      percentage: Math.min(100, Math.round((currentGoal.completed_books / currentGoal.target_books) * 100)),
      books_remaining: Math.max(0, currentGoal.target_books - currentGoal.completed_books)
    },
    booksCompleted: booksCompletedThisYear,
    previousGoals,
    milestones
  });
});

// Update challenge target
router.put('/target', (req, res) => {
  const userId = req.headers['x-user-id'] || 'usr_elena';
  const { target_books, year = new Date().getFullYear() } = req.body;

  if (!target_books || Number(target_books) < 1) {
    return res.status(400).json({ error: 'Target must be at least 1 book' });
  }

  const db = getDb();
  db.prepare(`
    INSERT INTO reading_goals (id, user_id, year, target_books, completed_books)
    VALUES (?, ?, ?, ?, 0)
    ON CONFLICT(user_id, year) DO UPDATE SET
      target_books = excluded.target_books,
      updated_at = CURRENT_TIMESTAMP
  `).run(`goal_${userId}_${year}`, userId, year, Number(target_books));

  const updated = db.prepare('SELECT * FROM reading_goals WHERE user_id = ? AND year = ?').get(userId, year);
  res.json({ message: 'Reading target updated successfully', goal: updated });
});

export default router;
